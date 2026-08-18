import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users } from "@/db/schema";
import { eq, and, or, gte, count, notInArray, sql, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ⚡ Requêtes en parallèle
    const [
      likesToday,
      superLikesToday,
      matchesForExclusion,
      actionsForExclusion,
      likesGivenTodayResult, // ✅ MODIFIÉ : Ne compte QUE les LIKES (pas les pass)
      superLikersData,
      currentUserData,
    ] = await Promise.all([
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

      db
        .select({ user1Id: matches.user1Id, user2Id: matches.user2Id })
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))),

      db
        .select({ toUserId: likes.toUserId })
        .from(likes)
        .where(eq(likes.fromUserId, userId)),

      // ✅ MODIFIÉ : Compter UNIQUEMENT les LIKES donnés (pas les pass)
      db
        .select({ c: count() })
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, userId),
            eq(likes.isLike, true), // ← IMPORTANT : Uniquement les likes
            gte(likes.createdAt, oneDayAgo)
          )
        ),

      db
        .select({
          id: users.id,
          firstName: users.firstName,
          photoUrl: users.photoUrl,
          createdAt: likes.createdAt,
        })
        .from(likes)
        .innerJoin(users, eq(likes.fromUserId, users.id))
        .where(
          and(
            eq(likes.toUserId, userId),
            eq(likes.isLike, true),
            eq(likes.isSuperLike, true),
            eq(users.isBanned, false)
          )
        )
        .orderBy(desc(likes.createdAt))
        .limit(3),

      db
        .select({ isPremium: users.isPremium })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
    ]);

    // Calculer pending likes
    const matchedUserIds = matchesForExclusion.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );
    const alreadyRespondedIds = actionsForExclusion.map((a) => a.toUserId);
    const excludeIds = [
      ...new Set([...matchedUserIds, ...alreadyRespondedIds, userId]),
    ];

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

    const filteredSuperLikers = superLikersData.filter(
      (sl) => !excludeIds.includes(sl.id)
    );

    return NextResponse.json(
      {
        likesToday: likesToday[0]?.c || 0,
        superLikesToday: superLikesToday[0]?.c || 0,
        pendingLikes: pendingLikesResult[0]?.c || 0,
        // ✅ MODIFIÉ : Renommé pour clarté (likesGivenToday au lieu de swipesToday)
        likesGivenToday: likesGivenTodayResult[0]?.c || 0,
        maxFreeLikes: 20, // Limite likes gratuits par jour
        isPremium: currentUserData[0]?.isPremium || false,
        recentSuperLikers: filteredSuperLikers.map((sl) => ({
          id: sl.id,
          firstName: sl.firstName,
          photoUrl: sl.photoUrl,
        })),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Discover stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
