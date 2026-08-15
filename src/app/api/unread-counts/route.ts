import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, messages, blocks, users } from "@/db/schema";
import { eq, and, or, count, ne, notInArray } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [myBlocks, blockedByOthers] = await Promise.all([
      db
        .select({ blockedUserId: blocks.blockedUserId })
        .from(blocks)
        .where(eq(blocks.blockerUserId, userId)),
      db
        .select({ blockerUserId: blocks.blockerUserId })
        .from(blocks)
        .where(eq(blocks.blockedUserId, userId)),
    ]);

    const blockedIds = [
      ...new Set([
        ...myBlocks.map((b) => b.blockedUserId),
        ...blockedByOthers.map((b) => b.blockerUserId),
      ]),
    ];

    const excludeOtherUser =
      blockedIds.length > 0
        ? notInArray(users.id, blockedIds)
        : undefined;

    const [likesReceivedResult, matchesResult, unreadMessagesResult] =
      await Promise.all([
        // Likes reçus, hors bloqués / bannis
        db
          .select({ c: count() })
          .from(likes)
          .innerJoin(users, eq(users.id, likes.fromUserId))
          .where(
            and(
              eq(likes.toUserId, userId),
              eq(likes.isLike, true),
              eq(users.isBanned, false),
              excludeOtherUser
            )
          ),

        // Matchs visibles uniquement (comme /matches)
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
              excludeOtherUser
            )
          ),

        // Messages non lus dans ces matchs visibles uniquement
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
              excludeOtherUser
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
