import { NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches } from "@/db/schema";
import { and, eq, desc, or } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer le dernier like/dislike de l'utilisateur
    const [lastLike] = await db
      .select()
      .from(likes)
      .where(eq(likes.fromUserId, userId))
      .orderBy(desc(likes.createdAt))
      .limit(1);

    if (!lastLike) {
      return NextResponse.json(
        { error: "Aucune action à annuler" },
        { status: 404 }
      );
    }

    const toUserId = lastLike.toUserId;

    // Si c'était un like et qu'il y avait un match, supprimer le match aussi
    if (lastLike.isLike) {
      const user1 = Math.min(userId, toUserId);
      const user2 = Math.max(userId, toUserId);

      await db
        .delete(matches)
        .where(
          and(
            eq(matches.user1Id, user1),
            eq(matches.user2Id, user2)
          )
        );
    }

    // Supprimer le like/dislike
    await db.delete(likes).where(eq(likes.id, lastLike.id));

    return NextResponse.json({
      success: true,
      restoredUserId: toUserId,
      wasLike: lastLike.isLike,
    });
  } catch (error) {
    console.error("Rewind error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
