import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, blocks } from "@/db/schema";
import { eq, notInArray, sql, and, gte, lte, ne, isNotNull } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { requirePhoto } from "@/lib/photo-check";
import { logApiCall } from "@/lib/api-logger";

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ NOUVEAU : Calcul compatibilité basé sur intérêts communs
function calculateCompatibility(
  myInterests: string | null,
  theirInterests: string | null
): number {
  if (!myInterests || !theirInterests) return 50;

  const mine = myInterests
    .toLowerCase()
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);
  const theirs = theirInterests
    .toLowerCase()
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  if (mine.length === 0 || theirs.length === 0) return 50;

  const commonCount = mine.filter((i) => theirs.includes(i)).length;
  const totalUnique = new Set([...mine, ...theirs]).size;

  // Score : 50% base + jusqu'à 50% selon intérêts communs
  const score = 50 + Math.round((commonCount / totalUnique) * 50);
  return Math.min(score, 99); // Max 99% (jamais 100)
}

// ✅ NOUVEAU : Récupérer intérêts communs
function getCommonInterests(
  myInterests: string | null,
  theirInterests: string | null
): string[] {
  if (!myInterests || !theirInterests) return [];

  const mine = myInterests
    .toLowerCase()
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);
  const theirs = theirInterests
    .toLowerCase()
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  return mine.filter((i) => theirs.includes(i));
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/discover";
  const method = "GET";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        errorMessage: "Utilisateur non authentifié",
        userAgent,
        ipAddress,
      });
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const photoCheck = await requirePhoto(userId);
    if (photoCheck) {
      logApiCall({
        endpoint,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Utilisateur sans photo bloqué",
        userAgent,
        ipAddress,
      });
      return photoCheck;
    }

    // ✅ AJOUT : Récupérer le filtre depuis l'URL
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all"; // all, verified, online, premium, new

    const [
      [currentUser],
      alreadyActed,
      myBlocks,
      blockedByOthers,
      superLikersReceived,
      likersReceived,
    ] = await Promise.all([
      db
        .select({
          prefGender: users.prefGender,
          prefAgeMin: users.prefAgeMin,
          prefAgeMax: users.prefAgeMax,
          prefLookingFor: users.prefLookingFor,
          prefMaxDistance: users.prefMaxDistance,
          latitude: users.latitude,
          longitude: users.longitude,
          interests: users.interests, // ✅ AJOUT : Mes intérêts
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(eq(likes.fromUserId, userId)),

      db
        .select({ blockedUserId: blocks.blockedUserId })
        .from(blocks)
        .where(eq(blocks.blockerUserId, userId)),

      db
        .select({ blockerUserId: blocks.blockerUserId })
        .from(blocks)
        .where(eq(blocks.blockedUserId, userId)),

      db
        .select({ fromUserId: likes.fromUserId })
        .from(likes)
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            eq(likes.isSuperLike, true)
          )
        ),

      db
        .select({ fromUserId: likes.fromUserId })
        .from(likes)
        .where(and(eq(likes.toUserId, userId), eq(likes.isLike, true))),
    ]);

    const prefGender = currentUser?.prefGender || "all";
    const prefAgeMin = currentUser?.prefAgeMin || 18;
    const prefAgeMax = currentUser?.prefAgeMax || 99;
    const prefLookingFor = currentUser?.prefLookingFor || "all";
    const prefMaxDistance = currentUser?.prefMaxDistance || 999999;
    const userLat = currentUser?.latitude;
    const userLon = currentUser?.longitude;
    const myInterests = currentUser?.interests || null; // ✅ AJOUT

    const excludeIds = alreadyActed.map((r) => r.toUserId);
    excludeIds.push(userId);

    const iBlocked = myBlocks.map((b) => b.blockedUserId);
    const blockedMe = blockedByOthers.map((b) => b.blockerUserId);
    excludeIds.push(...iBlocked, ...blockedMe);

    const superLikerIds = superLikersReceived.map((s) => s.fromUserId);
    const likerIds = likersReceived.map((l) => l.fromUserId);

    const now = new Date();
    const maxBirthDate = new Date(
      now.getFullYear() - prefAgeMin,
      now.getMonth(),
      now.getDate()
    )
      .toISOString()
      .split("T")[0];
    const minBirthDate = new Date(
      now.getFullYear() - prefAgeMax - 1,
      now.getMonth(),
      now.getDate()
    )
      .toISOString()
      .split("T")[0];

    const conditions = [
      notInArray(users.id, excludeIds),
      eq(users.isBanned, false),
      eq(users.isIncognito, false),
      lte(users.birthDate, maxBirthDate),
      gte(users.birthDate, minBirthDate),
      isNotNull(users.photoUrl),
      ne(users.photoUrl, ""),
      // ✅ FIX BUG : Vérifier que l'URL commence par http (pas cassée)
      sql`${users.photoUrl} LIKE 'http%'`,
    ];

    if (prefGender !== "all") {
      conditions.push(
        eq(
          users.gender,
          prefGender as "male" | "female" | "non_binary" | "other"
        )
      );
    }

    if (prefLookingFor !== "all") {
      conditions.push(
        eq(
          users.lookingFor,
          prefLookingFor as "relationship" | "friendship" | "casual" | "marriage"
        )
      );
    }

    // ✅ AJOUT : Filtres rapides
    if (filter === "verified") {
      conditions.push(eq(users.isVerified, true));
    } else if (filter === "online") {
      conditions.push(eq(users.isOnline, true));
    } else if (filter === "premium") {
      conditions.push(eq(users.isPremium, true));
    } else if (filter === "new") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      conditions.push(gte(users.createdAt, sevenDaysAgo));
    }

    const allProfiles = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        birthDate: users.birthDate,
        gender: users.gender,
        bio: users.bio,
        city: users.city,
        country: users.country,
        photoUrl: users.photoUrl,
        coverPhotoUrl: users.coverPhotoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        interests: users.interests,
        occupation: users.occupation,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        latitude: users.latitude,
        longitude: users.longitude,
        prompt1Question: users.prompt1Question,
        prompt1Answer: users.prompt1Answer,
        prompt2Question: users.prompt2Question,
        prompt2Answer: users.prompt2Answer,
        prompt3Question: users.prompt3Question,
        prompt3Answer: users.prompt3Answer,
        boostEndAt: users.boostEndAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(50);

    let profilesWithDistance = allProfiles.map((p) => {
      let distance: number | null = null;
      if (
        userLat != null &&
        userLon != null &&
        p.latitude != null &&
        p.longitude != null
      ) {
        distance = Math.round(
          calculateDistance(userLat, userLon, p.latitude, p.longitude)
        );
      }

      // ✅ AJOUT : Calcul compatibilité + intérêts communs
      const compatibility = calculateCompatibility(myInterests, p.interests);
      const commonInterests = getCommonInterests(myInterests, p.interests);

      return {
        ...p,
        distance,
        hasLikedMe: likerIds.includes(p.id),
        hasSuperLikedMe: superLikerIds.includes(p.id),
        compatibility, // ✅ NOUVEAU
        commonInterests, // ✅ NOUVEAU
      };
    });

    if (userLat != null && userLon != null && prefMaxDistance < 999999) {
      profilesWithDistance = profilesWithDistance.filter(
        (p) => p.distance === null || p.distance <= prefMaxDistance
      );
    }

    // Tri : Boostés > SuperLikes > Likes > Compatibilité élevée > reste
    const nowDate = new Date();
    profilesWithDistance.sort((a, b) => {
      const aBoost = a.boostEndAt ? new Date(a.boostEndAt) > nowDate : false;
      const bBoost = b.boostEndAt ? new Date(b.boostEndAt) > nowDate : false;
      if (aBoost && !bBoost) return -1;
      if (!aBoost && bBoost) return 1;

      if (a.hasSuperLikedMe && !b.hasSuperLikedMe) return -1;
      if (!a.hasSuperLikedMe && b.hasSuperLikedMe) return 1;

      if (a.hasLikedMe && !b.hasLikedMe) return -1;
      if (!a.hasLikedMe && b.hasLikedMe) return 1;

      // ✅ AJOUT : Tri par compatibilité en dernier
      return b.compatibility - a.compatibility;
    });

    const profiles = profilesWithDistance.slice(0, 20);

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: `${profiles.length} profils retournés (filter: ${filter})`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      { profiles },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Discover error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      errorMessage,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
