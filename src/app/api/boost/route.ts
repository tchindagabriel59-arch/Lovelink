import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// Limites de boosts
const BOOST_LIMITS = {
  free: 1,        // Gratuit : 1 boost / 24h
  premium: 3,     // Premium : 3 boosts / jour
  // Gold : illimité (à implémenter plus tard)
};

const BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const COOLDOWN_FREE_MS = 24 * 60 * 60 * 1000; // 24h pour gratuit

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
    const isPremium = user?.isPremium || false;
    const boostEnd = user?.boostEndAt ? new Date(user.boostEndAt) : null;
    const isActive = boostEnd ? boostEnd > now : false;
    const secondsRemaining = isActive && boostEnd
      ? Math.floor((boostEnd.getTime() - now.getTime()) / 1000)
      : 0;

    let canBoost = false;
    let cooldownSeconds = 0;
    let boostsUsedToday = 0;
    let boostsRemaining = 0;
    const limit = isPremium ? BOOST_LIMITS.premium : BOOST_LIMITS.free;

    if (isPremium) {
      // Premium : compter les boosts utilisés aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastBoost = user?.lastBoostAt ? new Date(user.lastBoostAt) : null;

      // Si le dernier boost est aujourd'hui, on utilise un système simple
      // Note : Pour un système parfait, il faudrait une table boost_history
      // Ici on approxime : si lastBoost aujourd'hui, on compte 1
      if (lastBoost && lastBoost >= today) {
        // Approximation : on considère 1 boost utilisé si dernier boost < 24h
        // Pour une vraie multi-boost par jour, il faudrait modifier le schéma
        boostsUsedToday = 1;
      }

      boostsRemaining = Math.max(0, limit - boostsUsedToday);
      canBoost = !isActive && boostsRemaining > 0;

      // Si tous les boosts sont utilisés, calculer le temps jusqu'à minuit
      if (boostsRemaining === 0 && !isActive) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        cooldownSeconds = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
      }
    } else {
      // Gratuit : cooldown 24h classique
      const lastBoost = user?.lastBoostAt ? new Date(user.lastBoostAt) : null;
      const cooldownEnd = lastBoost
        ? new Date(lastBoost.getTime() + COOLDOWN_FREE_MS)
        : null;
      canBoost = !isActive && (!cooldownEnd || cooldownEnd < now);
      cooldownSeconds = cooldownEnd && cooldownEnd > now
        ? Math.floor((cooldownEnd.getTime() - now.getTime()) / 1000)
        : 0;
      boostsUsedToday = lastBoost && cooldownEnd && cooldownEnd > now ? 1 : 0;
      boostsRemaining = Math.max(0, limit - boostsUsedToday);
    }

    return NextResponse.json({
      isActive,
      secondsRemaining,
      canBoost,
      cooldownSeconds,
      isPremium,
      boostsUsedToday,
      boostsRemaining,
      limit,
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
        boostEndAt: users.boostEndAt,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();
    const isPremium = user?.isPremium || false;

    // Vérifier si un boost est déjà actif
    if (user?.boostEndAt && new Date(user.boostEndAt) > now) {
      return NextResponse.json(
        {
          error: "Tu as déjà un boost actif !",
        },
        { status: 429 }
      );
    }

    if (isPremium) {
      // Premium : max 3 boosts par jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastBoost = user?.lastBoostAt ? new Date(user.lastBoostAt) : null;

      // Vérification simplifiée : si le dernier boost est d'aujourd'hui, on limite
      // Note : Idéalement il faudrait une table boost_history pour compter précisément
      if (lastBoost && lastBoost >= today) {
        // Pour Premium, on autorise jusqu'à 3 boosts, mais on ne peut pas les compter précisément
        // sans historique. On autorise si le dernier boost est terminé (>30min)
        const lastBoostEnd = new Date(lastBoost.getTime() + BOOST_DURATION_MS);
        if (lastBoostEnd > now) {
          return NextResponse.json(
            {
              error: "Tu as déjà un boost actif ou récent. Patiente un peu !",
            },
            { status: 429 }
          );
        }
      }
    } else {
      // Gratuit : cooldown 24h
      if (user?.lastBoostAt) {
        const lastBoost = new Date(user.lastBoostAt);
        const cooldownEnd = new Date(lastBoost.getTime() + COOLDOWN_FREE_MS);
        if (cooldownEnd > now) {
          const hoursLeft = Math.ceil(
            (cooldownEnd.getTime() - now.getTime()) / (60 * 60 * 1000)
          );
          return NextResponse.json(
            {
              error: "COOLDOWN",
              message: `Tu dois attendre ${hoursLeft}h avant de pouvoir booster à nouveau.`,
              hoursLeft,
              isPremium: false,
            },
            { status: 429 }
          );
        }
      }
    }

    // Activer le boost (30 minutes)
    const boostEnd = new Date(now.getTime() + BOOST_DURATION_MS);

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
      isPremium,
    });
  } catch (error) {
    console.error("Boost error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
