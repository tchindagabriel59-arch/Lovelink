import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, blocks } from "@/db/schema";
import { eq, notInArray, sql, and, gte, lte, ne, isNotNull, inArray } from "drizzle-orm";
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

  const score = 50 + Math.round((commonCount / totalUnique) * 50);
  return Math.min(score, 99);
}

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

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all";

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [currentUser],
      recentActions,
      oldPasses,
      allLikes,
      last10Swipes,
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
          interests: users.interests,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            gte(likes.createdAt, sevenDaysAgo)
          )
        ),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            eq(likes.isLike, false),
            lte(likes.createdAt, sevenDaysAgo)
          )
        ),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            eq(likes.isLike, true)
          )
        ),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(eq(likes.fromUserId, userId))
        .orderBy(sql`${likes.createdAt} DESC`)
        .limit(10),

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
    const myInterests = currentUser?.interests || null;

    const recentActionIds = recentActions.map((r) => r.toUserId);
    const likedIds = allLikes.map((l) => l.toUserId);
    const last10Ids = last10Swipes.map((l) => l.toUserId);
    const recyclableIds = oldPasses.map((p) => p.toUserId);

    const iBlocked = myBlocks.map((b) => b.blockedUserId);
    const blockedMe = blockedByOthers.map((b) => b.blockerUserId);

    const superLikerIds = superLikersReceived.map((s) => s.fromUserId);
    const likerIds = likersReceived.map((l) => l.fromUserId);

    // ✅ Exclusions pour les NOUVEAUX profils
    const newExcludeIds = Array.from(new Set([
      userId,
      ...likedIds,
      ...last10Ids,
      ...iBlocked,
      ...blockedMe,
      ...recentActionIds,
      ...recyclableIds,
    ]));

    // ✅ Fonction : Chercher NOUVEAUX profils
    const searchNewProfiles = async (
      ageMin: number,
      ageMax: number
    ) => {
      const now = new Date();
      const maxBirthDate = new Date(
        now.getFullYear() - ageMin,
        now.getMonth(),
        now.getDate()
      )
        .toISOString()
        .split("T")[0];
      const minBirthDate = new Date(
        now.getFullYear() - ageMax - 1,
        now.getMonth(),
        now.getDate()
      )
        .toISOString()
        .split("T")[0];

      const conditions = [
        newExcludeIds.length > 0 ? notInArray(users.id, newExcludeIds) : sql`1=1`,
        eq(users.isBanned, false),
        eq(users.isIncognito, false),
        lte(users.birthDate, maxBirthDate),
        gte(users.birthDate, minBirthDate),
        isNotNull(users.photoUrl),
        ne(users.photoUrl, ""),
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

      if (filter === "verified") {
        conditions.push(eq(users.isVerified, true));
      } else if (filter === "online") {
        conditions.push(eq(users.isOnline, true));
      } else if (filter === "premium") {
        conditions.push(eq(users.isPremium, true));
      } else if (filter === "new") {
        const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        conditions.push(gte(users.createdAt, sevenDaysAgoDate));
      }

      return await db
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
        .limit(40);
    };

    // ✅ Fonction : Chercher profils RECYCLABLES (passés > 7j)
    const searchRecycledProfiles = async () => {
      if (recyclableIds.length === 0) return [];

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
        inArray(users.id, recyclableIds),
        eq(users.isBanned, false),
        eq(users.isIncognito, false),
        lte(users.birthDate, maxBirthDate),
        gte(users.birthDate, minBirthDate),
        isNotNull(users.photoUrl),
        ne(users.photoUrl, ""),
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

      return await db
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
        .limit(10);
    };

    // ✅ Recherche NOUVEAUX avec élargissement progressif
    let newProfiles = await searchNewProfiles(prefAgeMin, prefAgeMax);
    let expandedSearch = false;

    if (newProfiles.length < 10) {
      const expandedAgeMin = Math.max(18, prefAgeMin - 5);
      const expandedAgeMax = Math.min(99, prefAgeMax + 5);
      newProfiles = await searchNewProfiles(expandedAgeMin, expandedAgeMax);
      expandedSearch = true;
    }

    if (newProfiles.length < 5) {
      const expandedAgeMin = Math.max(18, prefAgeMin - 10);
      const expandedAgeMax = Math.min(99, prefAgeMax + 10);
      newProfiles = await searchNewProfiles(expandedAgeMin, expandedAgeMax);
      expandedSearch = true;
    }

    // ✅ Chercher les recyclés
    const recycledProfiles = await searchRecycledProfiles();

    // ✅ INTERLEAVING : Mélanger 1 recyclé tous les 4 nouveaux
    const interleaved: typeof newProfiles = [];
    let recycledIndex = 0;

    for (let i = 0; i < newProfiles.length; i++) {
      interleaved.push(newProfiles[i]);

      if ((i + 1) % 4 === 0 && recycledIndex < recycledProfiles.length) {
        interleaved.push(recycledProfiles[recycledIndex]);
        recycledIndex++;
      }
    }

    // Ajouter les recyclés restants à la fin si besoin
    while (recycledIndex < recycledProfiles.length && interleaved.length < 30) {
      interleaved.push(recycledProfiles[recycledIndex]);
      recycledIndex++;
    }

    const allProfiles = interleaved;
    const recycledIdsSet = new Set(recycledProfiles.map((p) => p.id));

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

      const compatibility = calculateCompatibility(myInterests, p.interests);
      const commonInterests = getCommonInterests(myInterests, p.interests);
      const isRecycled = recycledIdsSet.has(p.id);

      return {
        ...p,
        distance,
        hasLikedMe: likerIds.includes(p.id),
        hasSuperLikedMe: superLikerIds.includes(p.id),
        compatibility,
        commonInterests,
        isRecycled,
      };
    });

    if (userLat != null && userLon != null && prefMaxDistance < 999999 && !expandedSearch) {
      profilesWithDistance = profilesWithDistance.filter(
        (p) => p.distance === null || p.distance <= prefMaxDistance
      );
    }

    // ✅ Tri léger : Prioriser Boostés + SuperLikers en tête, GARDER le mélange
    const nowDate = new Date();
    const priority: typeof profilesWithDistance = [];
    const normal: typeof profilesWithDistance = [];

    profilesWithDistance.forEach((p) => {
      const isBoost = p.boostEndAt ? new Date(p.boostEndAt) > nowDate : false;
      if (isBoost || p.hasSuperLikedMe) {
        priority.push(p);
      } else {
        normal.push(p);
      }
    });

    profilesWithDistance = [...priority, ...normal];

    const profiles = profilesWithDistance.slice(0, 20);

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: `${profiles.length} profils (filter: ${filter}, expanded: ${expandedSearch}, recycled: ${profiles.filter((p) => p.isRecycled).length})`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      {
        profiles,
        expandedSearch,
      },
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
