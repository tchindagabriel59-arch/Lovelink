import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, blocks } from "@/db/schema";
import { eq, notInArray, sql, and, gte, lte, inArray } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

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

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [currentUser] = await db
      .select({
        prefGender: users.prefGender,
        prefAgeMin: users.prefAgeMin,
        prefAgeMax: users.prefAgeMax,
        prefLookingFor: users.prefLookingFor,
        prefMaxDistance: users.prefMaxDistance,
        latitude: users.latitude,
        longitude: users.longitude,
        prompt1Question: users.prompt1Question,
        prompt1Answer: users.prompt1Answer,
        prompt2Question: users.prompt2Question,
        prompt2Answer: users.prompt2Answer,
        prompt3Question: users.prompt3Question,
        prompt3Answer: users.prompt3Answer,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const prefGender = currentUser?.prefGender || "all";
    const prefAgeMin = currentUser?.prefAgeMin || 18;
    const prefAgeMax = currentUser?.prefAgeMax || 99;
    const prefLookingFor = currentUser?.prefLookingFor || "all";
    const prefMaxDistance = currentUser?.prefMaxDistance || 999999;
    const userLat = currentUser?.latitude;
    const userLon = currentUser?.longitude;

    const alreadyActed = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

       const excludeIds = alreadyActed.map((r) => r.toUserId);
    excludeIds.push(userId);

    // 🆕 Exclure les utilisateurs bloqués (que j'ai bloqués OU qui m'ont bloqué)
    const myBlocks = await db
      .select({ blockedUserId: blocks.blockedUserId })
      .from(blocks)
      .where(eq(blocks.blockerUserId, userId));
    const iBlocked = myBlocks.map((b) => b.blockedUserId);

    const blockedByOthers = await db
      .select({ blockerUserId: blocks.blockerUserId })
      .from(blocks)
      .where(eq(blocks.blockedUserId, userId));
    const blockedMe = blockedByOthers.map((b) => b.blockerUserId);

    excludeIds.push(...iBlocked, ...blockedMe);

    // 🆕 Récupérer les IDs de ceux qui m'ont SUPER liké
    const superLikersReceived = await db
      .select({ fromUserId: likes.fromUserId })
      .from(likes)
      .where(
        and(
          eq(likes.toUserId, userId),
          eq(likes.isLike, true),
          eq(likes.isSuperLike, true)
        )
      );
    const superLikerIds = superLikersReceived.map((s) => s.fromUserId);

    // 🆕 Récupérer les IDs de ceux qui m'ont LIKÉ (normal)
    const likersReceived = await db
      .select({ fromUserId: likes.fromUserId })
      .from(likes)
      .where(
        and(
          eq(likes.toUserId, userId),
          eq(likes.isLike, true)
        )
      );
    const likerIds = likersReceived.map((l) => l.fromUserId);

    const now = new Date();
    const maxBirthDate = new Date(
      now.getFullYear() - prefAgeMin,
      now.getMonth(),
      now.getDate()
    ).toISOString().split("T")[0];
    const minBirthDate = new Date(
      now.getFullYear() - prefAgeMax - 1,
      now.getMonth(),
      now.getDate()
    ).toISOString().split("T")[0];

    const conditions = [
      notInArray(users.id, excludeIds),
      eq(users.isBanned, false),
      lte(users.birthDate, maxBirthDate),
      gte(users.birthDate, minBirthDate),
    ];

    if (prefGender !== "all") {
      conditions.push(eq(users.gender, prefGender as "male" | "female" | "non_binary" | "other"));
    }

    if (prefLookingFor !== "all") {
      conditions.push(
        eq(users.lookingFor, prefLookingFor as "relationship" | "friendship" | "casual" | "marriage")
      );
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
        latitude: users.latitude,
        longitude: users.longitude,
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
      return {
        ...p,
        distance,
        hasLikedMe: likerIds.includes(p.id),
        hasSuperLikedMe: superLikerIds.includes(p.id),
      };
    });

    if (userLat != null && userLon != null && prefMaxDistance < 999999) {
      profilesWithDistance = profilesWithDistance.filter(
        (p) => p.distance === null || p.distance <= prefMaxDistance
      );
    }

    // 🆕 Trier : Super Likes en premier, puis Likes, puis reste
    profilesWithDistance.sort((a, b) => {
      if (a.hasSuperLikedMe && !b.hasSuperLikedMe) return -1;
      if (!a.hasSuperLikedMe && b.hasSuperLikedMe) return 1;
      if (a.hasLikedMe && !b.hasLikedMe) return -1;
      if (!a.hasLikedMe && b.hasLikedMe) return 1;
      return 0;
    });

    const profiles = profilesWithDistance.slice(0, 20);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
