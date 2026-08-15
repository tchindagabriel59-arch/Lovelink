import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, messages } from "@/db/schema";
import { eq, and, or, count, ne, gt, isNull, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // ⚡ 3 requêtes EN PARALLÈLE = ultra rapide
    const [likesReceivedResult, matchesResult, unreadMessagesResult] =
      await Promise.all([
        // Likes reçus (total)
        db
          .select({ c: count() })
          .from(likes)
          .where(
            and(eq(likes.toUserId, userId), eq(likes.isLike, true))
          ),

        // Matchs (total)
        db
          .select({ c: count() })
          .from(matches)
          .where(
            or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
          ),

        // Messages non lus (reçus par moi)
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
      ]);

    return NextResponse.json(
      {
        likesReceived: likesReceivedResult[0]?.c || 0,
        matches: matchesResult[0]?.c || 0,
        unreadMessages: unreadMessagesResult[0]?.c || 0,
      },
      {
        headers: {
          // Cache 15s pour éviter surcharge
          "Cache-Control": "private, max-age=15",
        },
      }
    );
  } catch (error) {
    console.error("Unread counts error:", error);
    return NextResponse.json(
      {
        likesReceived: 0,
        matches: 0,
        unreadMessages: 0,
      },
      { status: 500 }
    );
  }
}
