import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, messages, blocks, users } from "@/db/schema";
import { eq, and, or, count, ne, notInArray, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // ⚡ Récupérer les données de filtrage EN PARALLÈLE
    const [myBlocks, blockedByOthers, existingMatches, myActions] =
      await Promise.all([
        db
          .select({ blockedUserId: blocks.blockedUserId })
          .from(blocks)
          .where(eq(blocks.blockerUserId, userId)),

        db
          .select({ blockerUserId: blocks.blockerUserId })
          .from(blocks)
          .where(eq(blocks.blockedUserId, userId)),

        // Tous mes matchs (pour exclure ceux qui sont dans "Qui m'a liké")
        db
          .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
          .from(matches)
          .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))),

        // Tous ceux à qui j'ai déjà répondu (like ou pass)
        db
          .select({ toUserId: likes.toUserId })
          .from(likes)
          .where(eq(likes.fromUserId, userId)),
      ]);

    // Blocages
    const blockedIds = [
      ...new Set([
        ...myBlocks.map((b) => b.blockedUserId),
        ...blockedByOthers.map((b) => b.blockerUserId),
      ]),
    ];

    // IDs déjà matchés
    const matchedUserIds = existingMatches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );

    // IDs à qui j'ai déjà répondu
    const alreadyRespondedIds = myActions.map((a) => a.toUserId);

    // Pour "Qui m'a liké" : exclure matchs + réponses + bloqués + moi
    const excludeForLikes = [
      ...new Set([
        ...matchedUserIds,
        ...alreadyRespondedIds,
        ...blockedIds,
        userId,
      ]),
    ];

    // Pour "Matchs" : exclure seulement les bloqués
    const excludeForMatches = blockedIds;

    // ⚡ 3 requêtes EN PARALLÈLE (exactement comme les pages)
    const [likesReceivedResult, matchesResult, unreadMessagesResult] =
      await Promise.all([
        // ✅ Likes reçus (mêmes filtres que /api/likes-received)
        db
          .select({ c: count() })
          .from(likes)
          .innerJoin(users, eq(likes.fromUserId, users.id))
          .where(
            and(
              eq(likes.toUserId, userId),
              eq(likes.isLike, true),
              eq(users.isBanned, false),
              excludeForLikes.length > 0
                ? notInArray(users.id, excludeForLikes)
                : sql`1=1`
            )
          ),

        // ✅ Matchs (mêmes filtres que /api/matches)
        db
          .select({ c: count() })
          .from(matches)
          .innerJoin(
            users,
            or(
              and(eq(matches.user1Id, userId), eq(users.id, matches.user2Id)),
              and(eq(matches.user2Id, userId), eq(users.id, matches.user1Id))
            )
          )
          .where(
            and(
              or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
              eq(users.isBanned, false),
              excludeForMatches.length > 0
                ? notInArray(users.id, excludeForMatches)
                : sql`1=1`
            )
          ),

        // ✅ Messages non lus (dans matchs visibles uniquement)
        db
          .select({ c: count() })
          .from(messages)
          .innerJoin(matches, eq(messages.matchId, matches.id))
          .innerJoin(
            users,
            or(
              and(eq(matches.user1Id, userId), eq(users.id, matches.user2Id)),
              and(eq(matches.user2Id, userId), eq(users.id, matches.user1Id))
            )
          )
          .where(
            and(
              or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
              ne(messages.senderId, userId),
              eq(messages.isRead, false),
              eq(users.isBanned, false),
              excludeForMatches.length > 0
                ? notInArray(users.id, excludeForMatches)
                : sql`1=1`
            )
          ),
      ]);

    return NextResponse.json(
      {
        likesReceived: Number(likesReceivedResult[0]?.c || 0),
        matches: Number(matchesResult[0]?.c || 0),
        unreadMessages: Number(unreadMessagesResult[0]?.c || 0),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10",
        },
      }
    );
  } catch (error) {
    console.error("Unread counts error:", error);
    return NextResponse.json(
      { likesReceived: 0, matches: 0, unreadMessages: 0 },
      { status: 500 }
    );
  }
}
