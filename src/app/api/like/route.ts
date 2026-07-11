import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { sendMatchEmail } from "@/lib/emails";
import { createNotification } from "@/lib/notifications";

// Limites de Super Likes par jour selon le plan
const SUPER_LIKE_LIMITS = {
  free: 1,      // Gratuit : 1/jour
  premium: 5,   // Premium : 5/jour
  // Gold : illimité (géré différemment)
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { toUserId, isLike, isSuperLike } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // 🔒 VÉRIFICATION LIMITE SUPER LIKE
    if (isSuperLike === true) {
      // Récupérer le statut Premium de l'utilisateur
      const [currentUser] = await db
        .select({
          isPremium: users.isPremium,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isPremium = currentUser?.isPremium || false;
      const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;

      // Compter les Super Likes envoyés aujourd'hui (dernières 24h)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const superLikesToday = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            eq(likes.isSuperLike, true),
            gte(likes.createdAt, today)
          )
        );

      const usedToday = superLikesToday[0]?.count || 0;

      if (usedToday >= limit) {
        return NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message: isPremium
              ? `Tu as atteint ta limite de ${limit} Super Likes par jour. Reviens demain !`
              : `Tu as utilisé ton Super Like gratuit du jour. Passe Premium pour en avoir ${SUPER_LIKE_LIMITS.premium}/jour !`,
            isPremium,
            used: usedToday,
            limit,
          },
          { status: 403 }
        );
      }
    }

    // Insérer le like/super like
    await db.insert(likes).values({
      fromUserId: userId,
      toUserId,
      isLike: isLike !== false,
      isSuperLike: isSuperLike === true,
    });

    let isMatch = false;
    let matchedUser = null;

    // 🔔 Créer une notification pour la personne likée
    if (isLike !== false) {
      await createNotification({
        userId: toUserId,
        type: isSuperLike ? "super_like" : "like",
        fromUserId: userId,
        content: isSuperLike ? "t'a super liké !" : "t'a liké !",
      });
    }

    if (isLike !== false) {
      const [mutual] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, toUserId),
            eq(likes.toUserId, userId),
            eq(likes.isLike, true)
          )
        )
        .limit(1);

      if (mutual) {
        const user1 = Math.min(userId, toUserId);
        const user2 = Math.max(userId, toUserId);

        const existingMatch = await db
          .select()
          .from(matches)
          .where(and(eq(matches.user1Id, user1), eq(matches.user2Id, user2)))
          .limit(1);

        if (existingMatch.length === 0) {
          await db.insert(matches).values({
            user1Id: user1,
            user2Id: user2,
          });
          isMatch = true;

          const [currentUser] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              photoUrl: users.photoUrl,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          const [otherUser] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              photoUrl: users.photoUrl,
            })
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

          matchedUser = otherUser;

          if (currentUser && otherUser) {
            await createNotification({
              userId: currentUser.id,
              type: "match",
              fromUserId: otherUser.id,
              content: `Nouveau match avec ${otherUser.firstName} !`,
            });
            await createNotification({
              userId: otherUser.id,
              type: "match",
              fromUserId: currentUser.id,
              content: `Nouveau match avec ${currentUser.firstName} !`,
            });

            sendMatchEmail(currentUser.email, currentUser.firstName, otherUser.firstName).catch(
              (err) => console.error("Erreur email match user1:", err)
            );
            sendMatchEmail(otherUser.email, otherUser.firstName, currentUser.firstName).catch(
              (err) => console.error("Erreur email match user2:", err)
            );
          }
        }
      }
    }

    if (!matchedUser && isMatch) {
      const [mu] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          photoUrl: users.photoUrl,
        })
        .from(users)
        .where(eq(users.id, toUserId))
        .limit(1);
      matchedUser = mu;
    }

    return NextResponse.json({ success: true, isMatch, matchedUser });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// 📊 GET : Récupérer le nombre de Super Likes utilisés aujourd'hui
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [currentUser] = await db
      .select({
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isPremium = currentUser?.isPremium || false;
    const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const superLikesToday = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(
        and(
          eq(likes.fromUserId, userId),
          eq(likes.isSuperLike, true),
          gte(likes.createdAt, today)
        )
      );

    const used = superLikesToday[0]?.count || 0;
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      isPremium,
      used,
      limit,
      remaining,
      canSuperLike: remaining > 0,
    });
  } catch (error) {
    console.error("Get super like status error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
