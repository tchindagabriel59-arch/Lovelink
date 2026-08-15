import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { typingStatus, matches } from "@/db/schema";
import { eq, and, or, ne, gt, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// ✍️ POST : Déclarer que je suis en train d'écrire
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId, isTyping } = await req.json();

    if (!matchId || typeof isTyping !== "boolean") {
      return NextResponse.json({ error: "Params invalides" }, { status: 400 });
    }

    // Vérifier que le user fait bien partie du match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // UPSERT : insère ou update
    // Si l'entrée existe déjà (matchId + userId) → update
    // Sinon → insert
    await db
      .insert(typingStatus)
      .values({
        matchId,
        userId,
        isTyping,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [typingStatus.matchId, typingStatus.userId],
        set: {
          isTyping,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// 👀 GET : Vérifier si l'AUTRE utilisateur est en train d'écrire
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchIdParam = searchParams.get("matchId");

    if (!matchIdParam) {
      return NextResponse.json({ error: "matchId requis" }, { status: 400 });
    }

    const matchId = parseInt(matchIdParam);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "matchId invalide" }, { status: 400 });
    }

    // Vérifier accès au match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ isTyping: false });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Auto-expiration : si updated_at > 5 secondes, on considère que la personne ne tape plus
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const [typing] = await db
      .select({
        isTyping: typingStatus.isTyping,
        updatedAt: typingStatus.updatedAt,
      })
      .from(typingStatus)
      .where(
        and(
          eq(typingStatus.matchId, matchId),
          ne(typingStatus.userId, userId), // L'AUTRE personne
          eq(typingStatus.isTyping, true),
          gt(typingStatus.updatedAt, fiveSecondsAgo) // Actif dans les 5 dernières secondes
        )
      )
      .limit(1);

    return NextResponse.json({
      isTyping: !!typing,
    });
  } catch (error) {
    console.error("Typing GET error:", error);
    return NextResponse.json({ isTyping: false });
  }
}
