import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";
import { sendMatchEmail } from "@/lib/emails";
import { requirePhoto } from "@/lib/photo-check";
import { logApiCall } from "@/lib/api-logger";

const SUPER_LIKE_LIMITS = {
  free: 1,
  premium: 5,
};

// ═══════════════════════════════════════
// GET : Statut Super Likes
// ═══════════════════════════════════════
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/like";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const superLikesToday = await db
      .select()
      .from(likes)
      .where(
        and(eq(likes.fromUserId, userId), eq(likes.isSuperLike, true))
      );

    const todaySuperLikes = superLikesToday.filter(
      (l) => l.createdAt && new Date(l.createdAt) >= today
    );

    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isPremium = currentUser[0]?.isPremium ?? false;
    const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;
    const used = todaySuperLikes.length;
    const remaining = Math.max(0, limit - used);
    const canSuperLike = remaining > 0;

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: `Super likes: ${used}/${limit} (${isPremium ? "Premium" : "Free"})`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      isPremium,
      used,
      limit,
      remaining,
      canSuperLike,
    });
  } catch (error) {
    console.error("Erreur GET like:", error);
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

// ═══════════════════════════════════════
// POST : Like / Super Like / Dislike
// ═══════════════════════════════════════
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/like";
  const method = "POST";
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
        errorMessage: "Like bloqué (pas de photo)",
        userAgent,
        ipAddress,
      });
      return photoCheck;
    }

    const { toUserId, isLike, isSuperLike } = await req.json();

    if (!toUserId || isLike === undefined) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Données manquantes (toUserId ou isLike)",
        userAgent,
        ipAddress,
      });
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Limite Super Like
    if (isSuperLike && isLike) {
      const currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isPremium = currentUser[0]?.isPremium ?? false;
      const limit = isPremium ? SUPER_LIKE_LIMITS.premium : SUPER_LIKE_LIMITS.free;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const superLikesToday = await db
        .select()
        .from(likes)
        .where(
          and(eq(likes.fromUserId, userId), eq(likes.isSuperLike, true))
        );

      const todayCount = superLikesToday.filter(
        (l) => l.createdAt && new Date(l.createdAt) >= today
      ).length;

      if (todayCount >= limit) {
        logApiCall({
          endpoint,
          method,
          statusCode: 403,
          durationMs: Date.now() - startTime,
          userId,
          errorMessage: `Limite Super Like atteinte (${todayCount}/${limit}, Premium: ${isPremium})`,
          userAgent,
          ipAddress,
        });

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

    const existingLike = await db
      .select()
      .from(likes)
      .where(
        and(eq(likes.fromUserId, userId), eq(likes.toUserId, toUserId))
      )
      .limit(1);

    if (existingLike.length > 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Doublon : déjà liké user ${toUserId}`,
        userAgent,
        ipAddress,
      });
      return NextResponse.json({ error: "Déjà liké" }, { status: 400 });
    }

    const fromUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const fromUserData = fromUser[0];

    await db.insert(likes).values({
      fromUserId: userId,
      toUserId,
      isLike,
      isSuperLike: isSuperLike ?? false,
    });

    let matchCreated = false;
    let matchId: number | null = null;

    if (isLike) {
      const mutualLike = await db
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

      if (mutualLike.length > 0) {
        const existingMatch = await db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.user1Id, Math.min(userId, toUserId)),
              eq(matches.user2Id, Math.max(userId, toUserId))
            )
          )
          .limit(1);

        if (existingMatch.length === 0) {
          const newMatch = await db
            .insert(matches)
            .values({
              user1Id: Math.min(userId, toUserId),
              user2Id: Math.max(userId, toUserId),
            })
            .returning();

          matchCreated = true;
          matchId = newMatch[0]?.id ?? null;

          const toUser = await db
            .select()
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

          const toUserData = toUser[0];
          const fromName = fromUserData?.firstName ?? "Quelqu'un";
          const toName = toUserData?.firstName ?? "Quelqu'un";

          await createNotification({
            userId: toUserId,
            type: "match",
            fromUserId: userId,
            content: `🎉 Vous avez un nouveau match avec ${fromName} !`,
          });

          await createNotification({
            userId: userId,
            type: "match",
            fromUserId: toUserId,
            content: `🎉 Vous avez un nouveau match avec ${toName} !`,
          });

          // 🔔 Push Match (non bloquant)
          sendPushToUser(toUserId, PushTemplates.match(fromName)).catch(() => {});
          sendPushToUser(userId, PushTemplates.match(toName)).catch(() => {});

          if (toUserData?.email && fromUserData?.firstName) {
            sendMatchEmail(
              toUserData.email,
              toUserData.firstName ?? "Cher membre",
              fromUserData.firstName
            ).catch((err) => console.error("Erreur email match:", err));
          }
        }
      } else {
        const fromName = fromUserData?.firstName ?? "Quelqu'un";

        if (isSuperLike) {
          await createNotification({
            userId: toUserId,
            type: "super_like",
            fromUserId: userId,
            content: `⭐ ${fromName} vous a envoyé un Super Like !`,
          });

          sendPushToUser(toUserId, PushTemplates.superLike(fromName)).catch(
            () => {}
          );
        } else {
          await createNotification({
            userId: toUserId,
            type: "like",
            fromUserId: userId,
            content: `💜 ${fromName} vous a liké !`,
          });

          sendPushToUser(toUserId, PushTemplates.like(fromName)).catch(
            () => {}
          );
        }
      }
    }

    const actionLabel = matchCreated
      ? `💕 MATCH créé avec user ${toUserId}!`
      : isLike
      ? isSuperLike
        ? `⭐ Super Like envoyé à user ${toUserId}`
        : `❤️ Like envoyé à user ${toUserId}`
      : `❌ Pass sur user ${toUserId}`;

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: actionLabel,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      matchCreated,
      isMatch: matchCreated,
      matchId,
    });
  } catch (error) {
    console.error("Erreur POST like:", error);
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
