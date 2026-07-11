import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { matches, messages } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// DELETE : Supprimer un match (unmatch)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdStr } = await params;
    const matchId = parseInt(matchIdStr, 10);

    // Vérifier que l'utilisateur fait partie du match
    const [match] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    // Supprimer tous les messages du match
    await db.delete(messages).where(eq(messages.matchId, matchId));

    // Supprimer le match
    await db.delete(matches).where(eq(matches.id, matchId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete match error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
