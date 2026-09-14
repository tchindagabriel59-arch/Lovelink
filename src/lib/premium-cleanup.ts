import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";

/**
 * Nettoie automatiquement les abonnements Premium expirés en BDD.
 * Passe `isPremium` à false et réinitialise `premiumPlan`.
 */
export async function cleanupExpiredPremium() {
  try {
    const now = new Date();

    // Met à jour tous les utilisateurs dont la date d'expiration est dépassée
    await db
      .update(users)
      .set({
        isPremium: false,
        premiumPlan: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(users.isPremium, true),
          lte(users.premiumExpiresAt, now)
        )
      );
  } catch (error) {
    console.error("[Premium Cleanup] Erreur lors du nettoyage :", error);
  }
}
