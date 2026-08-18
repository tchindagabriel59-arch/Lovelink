import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches } from "@/db/schema";
import { eq, and, or, gte, count, notInArray, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Date : dernières 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ⚡ Requêtes en parallèle
    const [
      likesToday,
      superLikesToday,
      matchesForExclusion,
      actionsForExclusion,
    ] = await Promise.all([
      // Likes reçus aujourd'hui
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            gte(likes.createdAt, oneDayAgo)
          )
        ),

      // Super Likes reçus aujourd'hui
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            eq(likes.isSuperLike, true),
            gte(likes.createdAt, oneDayAgo)
          )
        ),

      // Matchs pour exclusion (calculer pending)
      db
        .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))),

      // Actions pour exclusion
      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(eq(likes.fromUserId, userId)),
    ]);

    // Calculer les vrais likes en attente (pas déjà traités)
    const matchedUserIds = matchesForExclusion.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );
    const alreadyRespondedIds = actionsForExclusion.map((a) => a.toUserId);
    const excludeIds = [
      ...new Set([...matchedUserIds, ...alreadyRespondedIds, userId]),
    ];

    // Compter les likes VRAIMENT en attente
    const pendingLikesResult = await db
      .select({ c: count() })
      .from(likes)
      .where(
        and(
          eq(likes.toUserId, userId),
          eq(likes.isLike, true),
          excludeIds.length > 0
            ? notInArray(likes.fromUserId, excludeIds)
            : sql`1=1`
        )
      );

    return NextResponse.json(
      {
        likesToday: likesToday[0]?.c || 0,
        superLikesToday: superLikesToday[0]?.c || 0,
        pendingLikes: pendingLikesResult[0]?.c || 0,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Discover stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
