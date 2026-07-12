import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// GET : Récupérer l'état du mode incognito
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        isIncognito: users.isIncognito,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      isIncognito: user.isIncognito,
      isPremium: user.isPremium,
      canUseIncognito: user.isPremium, // Seuls les Premium peuvent
    });
  } catch (error) {
    console.error("Get incognito error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Toggle le mode incognito
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est Premium
    const [user] = await db
      .select({
        isIncognito: users.isIncognito,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 🔒 Bloquer si non-Premium
    if (!user.isPremium) {
      return NextResponse.json(
        {
          error: "PREMIUM_REQUIRED",
          message: "Le mode Incognito est réservé aux membres Premium 👑",
        },
        { status: 403 }
      );
    }

    // Toggle
    const newState = !user.isIncognito;

    await db
      .update(users)
      .set({
        isIncognito: newState,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      isIncognito: newState,
      message: newState
        ? "🕵️ Mode Incognito activé ! Ton profil est maintenant invisible dans Discover."
        : "👁️ Mode Incognito désactivé. Ton profil est à nouveau visible.",
    });
  } catch (error) {
    console.error("Toggle incognito error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
