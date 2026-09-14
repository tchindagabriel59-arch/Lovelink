import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, or, isNotNull } from "drizzle-orm";
import { isCurrentUserAdmin } from "@/lib/auth";
import { cleanupExpiredPremium } from "@/lib/premium-cleanup";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 🧹 Auto-nettoyage
    await cleanupExpiredPremium();

    // Récupérer TOUS ceux qui sont Premium OU qui ont une date/plan enregistrés
    const subscribers = await db
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
          isNotNull(users.premiumExpiresAt),
          isNotNull(users.premiumPlan)
        )
      )
      .orderBy(desc(users.premiumExpiresAt));

    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("Admin premium list error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
