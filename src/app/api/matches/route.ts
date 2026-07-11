import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, users, messages, blocks } from "@/db/schema";
import { eq, or, and, desc, sql, notInArray } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Exclure les utilisateurs bloqués
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

    const blockedIds = [...new Set([...iBlocked, ...blockedMe])];

    const userMatches = await db
      .select({
        matchId: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        matchedAt: matches.createdAt,
      })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
      .orderBy(desc(matches.createdAt));

    const result = [];

    for (const m of userMatches) {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;

      // Skip si l'autre utilisateur est bloqué
      if (blockedIds.includes(otherId)) continue;

      const [otherUser] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          city: users.city,
          isPremium: users.isPremium,
          isBanned: users.isBanned,
        })
        .from(users)
        .where(eq(users.id, otherId))
        .limit(1);

      // Skip si l'autre est banni
      if (!otherUser || otherUser.isBanned) continue;

      // Dernier message
      const [lastMsg] = await db
        .select({
          content: messages.content,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          isRead: messages.isRead,
        })
        .from(messages)
        .where(eq(messages.matchId, m.matchId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Compter messages non lus
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.matchId, m.matchId),
            eq(messages.isRead, false),
            sql`${messages.senderId} != ${userId}`
          )
        );

      result.push({
        matchId: m.matchId,
        matchedAt: m.matchedAt,
        user: otherUser,
        lastMessage: lastMsg || null,
        unreadCount: unreadResult?.count || 0,
      });
    }

    return NextResponse.json({ matches: result });
  } catch (error) {
    console.error("Matches error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
