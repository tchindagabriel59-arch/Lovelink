import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches } from "@/db/schema";
import { and, eq, desc, or, notInArray, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les IDs déjà matchés (pour les exclure)
    const existingMatches = await db
      .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    const matchedUserIds = existingMatches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );

    // Récupérer tous ceux à qui J'ai déjà répondu (like ou pass)
    const myActions = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const alreadyRespondedIds = myActions.map((a) => a.toUserId);

    // IDs à exclure : ceux avec qui j'ai déjà matché OU à qui j'ai déjà répondu
    const excludeIds = [...new Set([...matchedUserIds, ...alreadyRespondedIds, userId])];

    // Récupérer tous les likes reçus (pas encore traités)
    const likesReceived = await db
      .select({
        likeId: likes.id,
        isSuperLike: likes.isSuperLike,
        createdAt: likes.createdAt,
        user: {
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
          interests: users.interests,
          occupation: users.occupation,
          isOnline: users.isOnline,
          isPremium: users.isPremium,
        },
      })
      .from(likes)
      .innerJoin(users, eq(likes.fromUserId, users.id))
      .where(
        and(
          eq(likes.toUserId, userId),
          eq(likes.isLike, true),
          eq(users.isBanned, false),
          excludeIds.length > 0 ? notInArray(users.id, excludeIds) : sql`1=1`
        )
      )
      .orderBy(desc(likes.isSuperLike), desc(likes.createdAt));

    return NextResponse.json({ likes: likesReceived });
  } catch (error) {
    console.error("Get likes received error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
