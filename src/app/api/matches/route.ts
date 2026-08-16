import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { matches, users, messages, blocks } from "@/db/schema";
import { eq, or, and, desc, sql, inArray, ne } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { logApiCall } from "@/lib/api-logger";

export async function GET(req: NextRequest) {
  // ✅ MONITORING
  const startTime = Date.now();
  const endpoint = "/api/matches";
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

    // ⚡ ÉTAPE 1 : Récupérer matchs + blocages EN PARALLÈLE
    const [userMatches, myBlocks, blockedByOthers] = await Promise.all([
      db
        .select({
          matchId: matches.id,
          user1Id: matches.user1Id,
          user2Id: matches.user2Id,
          matchedAt: matches.createdAt,
        })
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
        .orderBy(desc(matches.createdAt)),

      db
        .select({ blockedUserId: blocks.blockedUserId })
        .from(blocks)
        .where(eq(blocks.blockerUserId, userId)),

      db
        .select({ blockerUserId: blocks.blockerUserId })
        .from(blocks)
        .where(eq(blocks.blockedUserId, userId)),
    ]);

    if (userMatches.length === 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "0 matchs trouvés",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { matches: [] },
        {
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
          },
        }
      );
    }

    // Blocages
    const blockedIds = new Set([
      ...myBlocks.map((b) => b.blockedUserId),
      ...blockedByOthers.map((b) => b.blockerUserId),
    ]);

    // Filtrer les matchs valides (pas bloqués)
    const validMatches = userMatches.filter((m) => {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
      return !blockedIds.has(otherId);
    });

    if (validMatches.length === 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Tous les matchs filtrés (bloqués)",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { matches: [] },
        {
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
          },
        }
      );
    }

    const otherUserIds = validMatches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );
    const matchIds = validMatches.map((m) => m.matchId);

    // ⚡ ÉTAPE 2 : 3 requêtes EN PARALLÈLE (OPTIMISÉES)
    const [otherUsers, lastMessagesData, unreadCounts] = await Promise.all([
      // ⚡ Users : Sélection minimale (moins de données transférées)
      db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          city: users.city,
          isPremium: users.isPremium,
          isVerified: users.isVerified,
          isBanned: users.isBanned,
        })
        .from(users)
        .where(inArray(users.id, otherUserIds)),

      // ⚡ OPTIMISÉ : Uniquement le DERNIER message par match (via DISTINCT ON PostgreSQL)
      // Beaucoup plus rapide que de récupérer tous les messages
      db.execute(sql`
        SELECT DISTINCT ON (match_id) 
          match_id as "matchId",
          content,
          sender_id as "senderId",
          created_at as "createdAt",
          is_read as "isRead"
        FROM messages
        WHERE match_id = ANY(${matchIds})
        ORDER BY match_id, created_at DESC
      `),

      // ⚡ Unread counts (utilise le nouvel index)
      db
        .select({
          matchId: messages.matchId,
          count: sql<number>`count(*)::int`,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.matchId, matchIds),
            eq(messages.isRead, false),
            ne(messages.senderId, userId)
          )
        )
        .groupBy(messages.matchId),
    ]);

    // Créer les Maps pour accès O(1)
    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    // Map des derniers messages (direct depuis SQL, déjà filtrés)
    const lastMessageMap = new Map<number, any>();
    const rows = lastMessagesData.rows as Array<{
      matchId: number;
      content: string;
      senderId: number;
      createdAt: Date;
      isRead: boolean;
    }>;

    for (const msg of rows) {
      lastMessageMap.set(Number(msg.matchId), {
        content: msg.content,
        senderId: Number(msg.senderId),
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      });
    }

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.matchId, Number(u.count)])
    );

    // Construire le résultat final
    const result = validMatches
      .map((m) => {
        const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
        const otherUser = userMap.get(otherId);

        if (!otherUser || otherUser.isBanned) return null;

        return {
          matchId: m.matchId,
          matchedAt: m.matchedAt,
          user: otherUser,
          lastMessage: lastMessageMap.get(m.matchId) || null,
          unreadCount: unreadMap.get(m.matchId) || 0,
        };
      })
      .filter((m) => m !== null);

    const totalUnread = Array.from(unreadMap.values()).reduce((a, b) => a + b, 0);

    // ✅ LOG succès
    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: `${result.length} matchs, ${totalUnread} messages non lus`,
      userAgent,
      ipAddress,
    });

    // ⚡ Cache HTTP augmenté à 30s (matchs changent peu)
    return NextResponse.json(
      { matches: result },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Matches error:", error);
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
