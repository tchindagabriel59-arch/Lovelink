import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes } from "@/db/schema";
import { eq, notInArray, sql, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get IDs the user has already liked/disliked
    const alreadyActed = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const excludeIds = alreadyActed.map((r) => r.toUserId);
    excludeIds.push(userId);

    const profiles = await db
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
      })
      .from(users)
      .where(
        and(
          notInArray(users.id, excludeIds),
          eq(users.isBanned, false)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(20);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
