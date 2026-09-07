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

    // 1. Vérifier si l'utilisateur actuel est Premium
    const [currentUser] = await db
      .select({
        isPremium: users.isPremium,
        premiumExpiresAt: users.premiumExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();
    const isPremiumActive =
      currentUser?.isPremium &&
      (!currentUser.premiumExpiresAt ||
        new Date(currentUser.premiumExpiresAt) > now);

    // 2. Récupérer tous les IDs déjà matchés (pour les exclure)
    const existingMatches = await db
      .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    const matchedUserIds = existingMatches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );

    // 3. Récupérer tous ceux à qui J'ai déjà répondu (like ou pass)
    const myActions = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const alreadyRespondedIds = myActions.map((a) => a.toUserId);

    // 4. IDs à exclure
    const excludeIds = [
      ...new Set([...matchedUserIds, ...alreadyRespondedIds, userId]),
    ];

    // 5. Récupérer tous les likes reçus (pas encore traités)
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
          isVerified: users.isVerified,
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

    // 6. 🔒 SÉCURITÉ CÔTÉ SERVEUR
    // Si Free : on masque les données sensibles avant de les envoyer
    const safeLikes = likesReceived.map((like) => {
      if (isPremiumActive) {
        // Premium → données complètes
        return like;
      }

      // Free → données masquées (rien de sensible ne quitte le serveur)
      return {
        likeId: like.likeId,
        isSuperLike: like.isSuperLike,
        createdAt: like.createdAt,
        user: {
          id: 0, // ID masqué pour empêcher l'accès direct au profil
          firstName: "?????",
          lastName: "",
          birthDate: like.user.birthDate, // On garde l'âge seulement
          gender: like.user.gender,
          bio: null,
          city: null,
          country: null,
          photoUrl: null, // 🔒 Photo NON envoyée
          coverPhotoUrl: null,
          interests: null,
          occupation: null,
          isOnline: false,
          isPremium: like.user.isPremium, // On garde pour montrer le ruban "Premium a craqué sur toi"
          isVerified: like.user.isVerified,
        },
      };
    });

    return NextResponse.json({
      likes: safeLikes,
      isPremium: isPremiumActive,
      total: likesReceived.length,
      premiumLikesCount: likesReceived.filter((l) => l.user.isPremium).length,
    });
  } catch (error) {
    console.error("Get likes received error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
