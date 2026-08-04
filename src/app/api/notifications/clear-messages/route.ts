import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

/**
 * POST /api/notifications/clear-messages
 * Supprime toutes les notifications de type "message" 
 * provenant d'un utilisateur spécifique.
 * 
 * Appelé quand l'utilisateur ouvre une conversation
 * pour nettoyer les notifs déjà "lues" naturellement.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { fromUserId } = await req.json();

    if (!fromUserId || typeof fromUserId !== "number") {
      return NextResponse.json(
        { error: "fromUserId manquant ou invalide" },
        { status: 400 }
      );
    }

    // Supprimer toutes les notifs "message" de cette personne
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "message"),
          eq(notifications.fromUserId, fromUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear messages notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
