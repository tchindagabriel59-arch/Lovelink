import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages, notifications } from "@/db/schema";
import { eq, and, or, gte, count, desc, ne, notInArray, inArray, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Dates de référence
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ⚡ OPTIMISATION : Toutes les requêtes en PARALLÈLE
    const [
      currentUserData,
      likesGivenResult,
      likesGivenTodayResult,
      likesReceivedResult,
      likesReceivedThisWeekResult,
      superLikesReceivedResult,
      matchesResult,
      matchesThisWeekResult,
      messagesSentResult,
      unreadMessagesResult,
      unreadNotifsResult,
      recentNotifsData,
      // ✅ AJOUT : Récupérer les données pour calculer pendingLikes
      userMatchesForExclusion,
      userActionsForExclusion,
    ] = await Promise.all([
      // Infos du user pour calculer complétude
      db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          photoUrl: users.photoUrl,
          photo1Url: users.photo1Url,
          photo2Url: users.photo2Url,
          photo3Url: users.photo3Url,
          birthDate: users.birthDate,
          gender: users.gender,
          city: users.city,
          country: users.country,
          occupation: users.occupation,
          interests: users.interests,
          prompt1Answer: users.prompt1Answer,
          prompt2Answer: users.prompt2Answer,
          prompt3Answer: users.prompt3Answer,
          latitude: users.latitude,
          longitude: users.longitude,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      // Likes donnés (total)
      db
        .select({ c: count() })
        .from(likes)
        .where(and(eq(likes.fromUserId, userId), eq(likes.isLike, true))),

      // Likes donnés aujourd'hui
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            eq(likes.isLike, true),
            gte(likes.createdAt, oneDayAgo)
          )
        ),

      // Likes reçus (total)
      db
        .select({ c: count() })
        .from(likes)
        .where(and(eq(likes.toUserId, userId), eq(likes.isLike, true))),

      // Likes reçus cette semaine
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            gte(likes.createdAt, oneWeekAgo)
          )
        ),

      // Super likes reçus
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            eq(likes.isSuperLike, true)
          )
        ),

      // Matchs (total)
      db
        .select({ c: count() })
        .from(matches)
        .where(
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
        ),

      // Matchs cette semaine
      db
        .select({ c: count() })
        .from(matches)
        .where(
          and(
            or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
            gte(matches.createdAt, oneWeekAgo)
          )
        ),

      // Messages envoyés
      db
        .select({ c: count() })
        .from(messages)
        .where(eq(messages.senderId, userId)),

      // Messages non lus dans les matchs de l'utilisateur
      db
        .select({ c: count() })
        .from(messages)
        .innerJoin(matches, eq(messages.matchId, matches.id))
        .where(
          and(
            or(
              eq(matches.user1Id, userId),
              eq(matches.user2Id, userId)
            ),
            ne(messages.senderId, userId),
            eq(messages.isRead, false)
          )
        ),

      // Notifs non lues
      db
        .select({ c: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        ),

      // 5 dernières notifications
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          content: notifications.content,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          fromUserId: notifications.fromUserId,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(5),

      // ✅ AJOUT : IDs des matchs pour exclusion
      db
        .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))),

      // ✅ AJOUT : IDs des personnes à qui j'ai répondu (like/pass)
      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(eq(likes.fromUserId, userId)),
    ]);

    const user = currentUserData[0];

    // ═══════════════════════════════════════
    // ✅ NOUVEAU : CALCUL DES LIKES EN ATTENTE
    // ═══════════════════════════════════════
    const matchedUserIds = userMatchesForExclusion.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );
    const alreadyRespondedIds = userActionsForExclusion.map((a) => a.toUserId);
    const excludeIds = [
      ...new Set([...matchedUserIds, ...alreadyRespondedIds, userId]),
    ];

    // Compter les likes EN ATTENTE (même logique que /api/likes-received)
    const pendingLikesResult = await db
      .select({ c: count() })
      .from(likes)
      .innerJoin(users, eq(likes.fromUserId, users.id))
      .where(
        and(
          eq(likes.toUserId, userId),
          eq(likes.isLike, true),
          eq(users.isBanned, false),
          excludeIds.length > 0
            ? notInArray(users.id, excludeIds)
            : sql`1=1`
        )
      );

    const pendingLikes = pendingLikesResult[0]?.c || 0;

    // ═══════════════════════════════════════
    // CALCUL DE LA COMPLÉTUDE DU PROFIL
    // ═══════════════════════════════════════
    let completionScore = 0;
    const maxScore = 100;

    if (user?.photoUrl) completionScore += 30;
    if (user?.photo1Url) completionScore += 5;
    if (user?.photo2Url) completionScore += 5;
    if (user?.photo3Url) completionScore += 5;
    if (user?.bio && user.bio.length >= 30) completionScore += 15;
    else if (user?.bio && user.bio.length > 0) completionScore += 7;
    if (user?.city && user?.country) completionScore += 5;
    if (user?.occupation) completionScore += 5;
    if (user?.interests) completionScore += 5;
    if (user?.prompt1Answer) completionScore += 5;
    if (user?.prompt2Answer) completionScore += 5;
    if (user?.prompt3Answer) completionScore += 5;
    if (user?.latitude && user?.longitude) completionScore += 5;

    const completion = Math.min(completionScore, maxScore);

    // ═══════════════════════════════════════
    // SUGGESTIONS INTELLIGENTES
    // ═══════════════════════════════════════
    const suggestions: Array<{ icon: string; text: string; link: string }> = [];

    if (!user?.photoUrl) {
      suggestions.push({
        icon: "📸",
        text: "Ajoute une photo de profil pour x10 tes matchs",
        link: "/profile",
      });
    }
    if (!user?.bio || user.bio.length < 30) {
      suggestions.push({
        icon: "✍️",
        text: "Écris une bio de 30+ caractères pour te démarquer",
        link: "/profile",
      });
    }
    if (!user?.photo1Url || !user?.photo2Url) {
      suggestions.push({
        icon: "🖼️",
        text: "Ajoute plus de photos pour x3 les vues sur ton profil",
        link: "/profile",
      });
    }
    if (!user?.prompt1Answer) {
      suggestions.push({
        icon: "💡",
        text: "Réponds à un prompt pour capter l'attention",
        link: "/profile",
      });
    }
    if (!user?.latitude || !user?.longitude) {
      suggestions.push({
        icon: "📍",
        text: "Active ta géolocalisation pour rencontrer des gens près de toi",
        link: "/preferences",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: "🚀",
        text: "Booste ton profil pour 10x plus de vues !",
        link: "/boost",
      });
    }

    // ═══════════════════════════════════════
    // ENRICHIR LES NOTIFICATIONS
    // ═══════════════════════════════════════
    const notifSenderIds = recentNotifsData
      .map((n) => n.fromUserId)
      .filter((id): id is number => id !== null);

    let senderMap = new Map<
      number,
      { id: number; firstName: string; photoUrl: string | null }
    >();

    if (notifSenderIds.length > 0) {
      // ✅ OPTIMISÉ : Utilise inArray au lieu de or(...map)
      const senders = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          photoUrl: users.photoUrl,
        })
        .from(users)
        .where(inArray(users.id, notifSenderIds));

      senders.forEach((s) => senderMap.set(s.id, s));
    }

    const recentNotifs = recentNotifsData.map((n) => ({
      id: n.id,
      type: n.type,
      content: n.content,
      isRead: n.isRead,
      createdAt: n.createdAt,
      fromUser: n.fromUserId ? senderMap.get(n.fromUserId) || null : null,
    }));

    // ═══════════════════════════════════════
    // RÉPONSE FINALE
    // ═══════════════════════════════════════
    return NextResponse.json(
      {
        stats: {
          likesGiven: likesGivenResult[0]?.c || 0,
          likesGivenToday: likesGivenTodayResult[0]?.c || 0,
          likesReceived: likesReceivedResult[0]?.c || 0,
          likesReceivedThisWeek: likesReceivedThisWeekResult[0]?.c || 0,
          superLikesReceived: superLikesReceivedResult[0]?.c || 0,
          pendingLikes, // ✅ NOUVEAU : Likes en attente de réponse
          matches: matchesResult[0]?.c || 0,
          matchesThisWeek: matchesThisWeekResult[0]?.c || 0,
          messagesSent: messagesSentResult[0]?.c || 0,
          unreadMessages: unreadMessagesResult[0]?.c || 0,
          unreadNotifs: unreadNotifsResult[0]?.c || 0,
        },
        completion,
        suggestions: suggestions.slice(0, 3),
        recentNotifs,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
