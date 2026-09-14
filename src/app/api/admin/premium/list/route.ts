import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { isCurrentUserAdmin } from "@/lib/auth";
import { cleanupExpiredPremium } from "@/lib/premium-cleanup";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 🧹 Lancer le nettoyage automatique des expirés
    await cleanupExpiredPremium();

    const now = new Date();

    // Récupérer les abonnés actifs et expirés
    const allSubscribers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        city: users.city,
        photoUrl: users.photoUrl,
        isPremium: users.isPremium,
        premiumPlan: users.premiumPlan,
        premiumExpiresAt: users.premiumExpiresAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          eq(users.isPremium, true),
          and(
            eq(users.isPremium, false),
            // Garder un historique des 30 derniers jours d'expiration
            gte(users.premiumExpiresAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
          )
        )
      )
      .orderBy(desc(users.premiumExpiresAt));

    return NextResponse.json({ subscribers: allSubscribers });
  } catch (error) {
    console.error("Admin premium list error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
