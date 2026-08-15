import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, users, messages, blocks } from "@/db/schema";
import { eq, or, and, desc, sql, inArray, ne } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // ⚡ ÉTAPE 1 : Récupérer TOUS les matchs + blocages EN PARALLÈLE
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

    // Si aucun match, retour immédiat
    if (userMatches.length === 0) {
      return NextResponse.json(
        { matches: [] },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        }
      );
    }

    // Blocages
    const blockedIds = new Set([
      ...myBlocks.map((b) => b.blockedUserId),
      ...blockedByOthers.map((b) => b.blockerUserId),
    ]);

    // Filtrer les matchs valides
    const validMatches = userMatches.filter((m) => {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
      return !blockedIds.has(otherId);
    });

    if (validMatches.length === 0) {
      return NextResponse.json(
        { matches: [] },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        }
      );
    }

    // Récupérer les IDs
    const otherUserIds = validMatches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );
    const matchIds = validMatches.map((m) => m.matchId);

    // ⚡ ÉTAPE 2 : Récupérer TOUS les users + messages + unread EN PARALLÈLE
    // 3 requêtes au lieu de 60+ !
    const [otherUsers, lastMessagesData, unreadCounts] = await Promise.all([
      // Tous les utilisateurs en 1 requête
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

      // ⚡ TOUS les derniers messages en 1 requête (avec DISTINCT ON)
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

      // ⚡ TOUS les unread counts en 1 requête (avec GROUP BY)
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

    // Créer des Maps pour accès O(1)
    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    const lastMessageMap = new Map<number, any>();
    for (const row of lastMessagesData.rows as any[]) {
      lastMessageMap.set(row.matchId, {
        content: row.content,
        senderId: row.senderId,
        createdAt: row.createdAt,
        isRead: row.isRead,
      });
    }

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.matchId, u.count])
    );

    // Construire le résultat final (aucune requête SQL supplémentaire)
    const result = validMatches
      .map((m) => {
        const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
        const otherUser = userMap.get(otherId);

        // Skip si banni
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

    return NextResponse.json(
      { matches: result },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Matches error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
