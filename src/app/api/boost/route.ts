import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// GET : Vérifier l'état du boost
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        boostEndAt: users.boostEndAt,
        lastBoostAt: users.lastBoostAt,
        boostViews: users.boostViews,
        boostLikes: users.boostLikes,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();
    const boostEnd = user?.boostEndAt ? new Date(user.boostEndAt) : null;
    const isActive = boostEnd ? boostEnd > now : false;
    const secondsRemaining = isActive && boostEnd
      ? Math.floor((boostEnd.getTime() - now.getTime()) / 1000)
      : 0;

    // Cooldown : 24h entre 2 boosts (sauf Premium = illimité)
    const lastBoost = user?.lastBoostAt ? new Date(user.lastBoostAt) : null;
    const cooldownEnd = lastBoost
      ? new Date(lastBoost.getTime() + 24 * 60 * 60 * 1000)
      : null;
    const canBoost = user?.isPremium || !cooldownEnd || cooldownEnd < now;
    const cooldownSeconds = cooldownEnd && cooldownEnd > now
      ? Math.floor((cooldownEnd.getTime() - now.getTime()) / 1000)
      : 0;

    return NextResponse.json({
      isActive,
      secondsRemaining,
      canBoost,
      cooldownSeconds,
      isPremium: user?.isPremium || false,
      stats: {
        views: user?.boostViews || 0,
        likes: user?.boostLikes || 0,
      },
    });
  } catch (error) {
    console.error("Get boost error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Activer le boost
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        lastBoostAt: users.lastBoostAt,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();

    // Vérifier cooldown (sauf Premium)
    if (!user?.isPremium && user?.lastBoostAt) {
      const lastBoost = new Date(user.lastBoostAt);
      const cooldownEnd = new Date(lastBoost.getTime() + 24 * 60 * 60 * 1000);
      if (cooldownEnd > now) {
        const hoursLeft = Math.ceil(
          (cooldownEnd.getTime() - now.getTime()) / (60 * 60 * 1000)
        );
        return NextResponse.json(
          {
            error: `Tu dois attendre ${hoursLeft}h avant de pouvoir booster à nouveau. Passe Premium pour des boosts illimités !`,
          },
          { status: 429 }
        );
      }
    }

    // Boost de 30 minutes
    const boostEnd = new Date(now.getTime() + 30 * 60 * 1000);

    await db
      .update(users)
      .set({
        boostEndAt: boostEnd,
        lastBoostAt: now,
        boostViews: 0,
        boostLikes: 0,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "🚀 Boost activé ! Tu vas apparaître en premier pendant 30 minutes.",
      boostEndAt: boostEnd,
    });
  } catch (error) {
    console.error("Boost error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
