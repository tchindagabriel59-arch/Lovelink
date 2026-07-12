import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";

const SUPER_LIKE_LIMITS = {
  free: 1,
  premium: 5,
};

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const superLikesToday = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.fromUserId, authUser.id),
          eq(likes.isSuperLike, true)
        )
      );

    const todaySuperLikes = superLikesToday.filter(
      (l) => new Date(l.createdAt) >= today
    );

    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const isPremium = currentUser[0]?.isPremium ?? false;
    const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;
    const used = todaySuperLikes.length;
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      superLikesUsed: used,
      superLikesLimit: limit,
      superLikesRemaining: remaining,
      isPremium,
    });
  } catch (error) {
    console.error("Erreur GET like:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { toUserId, isLike, isSuperLike } = await req.json();

    if (!toUserId || isLike === undefined) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier limite Super Like
    if (isSuperLike && isLike) {
      const currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.id))
        .limit(1);

      const isPremium = currentUser[0]?.isPremium ?? false;
      const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const superLikesToday = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, authUser.id),
            eq(likes.isSuperLike, true)
          )
        );

      const todayCount = superLikesToday.filter(
        (l) => new Date(l.createdAt) >= today
      ).length;

      if (todayCount >= limit) {
        return NextResponse.json(
          {
            error: isPremium
              ? `Limite atteinte : ${limit} Super Likes par jour`
              : `Limite atteinte : ${limit} Super Like par jour (Premium = 5/jour)`,
            code: "SUPER_LIKE_LIMIT",
            isPremium,
          },
          { status: 403 }
        );
      }
    }

    // Vérifier si déjà liké
    const existingLike = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.fromUserId, authUser.id),
          eq(likes.toUserId, toUserId)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json({ error: "Déjà liké" }, { status: 400 });
    }

    // Récupérer infos de l'auteur du like
    const fromUser = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const fromUserData = fromUser[0];

    // Insérer le like
    await db.insert(likes).values({
      fromUserId: authUser.id,
      toUserId,
      isLike,
      isSuperLike: isSuperLike ?? false,
    });

    let matchCreated = false;
    let matchId: number | null = null;

    if (isLike) {
      // Vérifier si like mutuel (match)
      const mutualLike = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, toUserId),
            eq(likes.toUserId, authUser.id),
            eq(likes.isLike, true)
          )
        )
        .limit(1);

      if (mutualLike.length > 0) {
        // Vérifier si match déjà existant
        const existingMatch = await db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.user1Id, Math.min(authUser.id, toUserId)),
              eq(matches.user2Id, Math.max(authUser.id, toUserId))
            )
          )
          .limit(1);

        if (existingMatch.length === 0) {
          // Créer le match
          const newMatch = await db
            .insert(matches)
            .values({
              user1Id: Math.min(authUser.id, toUserId),
              user2Id: Math.max(authUser.id, toUserId),
            })
            .returning();

          matchCreated = true;
          matchId = newMatch[0]?.id ?? null;

          // Récupérer infos du destinataire
          const toUser = await db
            .select()
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

          const toUserData = toUser[0];

          // Notification in-app pour les 2
          await createNotification({
            userId: toUserId,
            type: "match",
            fromUserId: authUser.id,
            content: `🎉 Vous avez un nouveau match avec ${fromUserData?.firstName ?? "quelqu'un"} !`,
          });

          await createNotification({
            userId: authUser.id,
            type: "match",
            fromUserId: toUserId,
            content: `🎉 Vous avez un nouveau match avec ${toUserData?.firstName ?? "quelqu'un"} !`,
          });

          // 🔔 Push notification MATCH aux 2 utilisateurs
          await sendPushToUser(
            toUserId,
            PushTemplates.match(fromUserData?.firstName ?? "Quelqu'un")
          );

          await sendPushToUser(
            authUser.id,
            PushTemplates.match(toUserData?.firstName ?? "Quelqu'un")
          );
        }
      } else {
        // Pas de match → notif like simple ou super like
        if (isSuperLike) {
          await createNotification({
            userId: toUserId,
            type: "super_like",
            fromUserId: authUser.id,
            content: `⭐ ${fromUserData?.firstName ?? "Quelqu'un"} vous a envoyé un Super Like !`,
          });

          // 🔔 Push notification SUPER LIKE
          await sendPushToUser(
            toUserId,
            PushTemplates.superLike(fromUserData?.firstName ?? "Quelqu'un")
          );
        } else {
          await createNotification({
            userId: toUserId,
            type: "like",
            fromUserId: authUser.id,
            content: `💜 ${fromUserData?.firstName ?? "Quelqu'un"} vous a liké !`,
          });

          // 🔔 Push notification LIKE
          await sendPushToUser(
            toUserId,
            PushTemplates.like(fromUserData?.firstName ?? "Quelqu'un")
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchCreated,
      matchId,
    });
  } catch (error) {
    console.error("Erreur POST like:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
