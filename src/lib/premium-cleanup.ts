import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, lte, isNull, or, isNotNull } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

/**
 * Nettoie automatiquement la BDD :
 * Passe isPremium à false si la date est dépassée OU si la date est nulle/invalide.
 */
export async function cleanupExpiredPremium() {
  try {
    const now = new Date();

    // 1. Trouver tous les faux Premium (date dépassée OU pas de date enregistrée)
    const expiredUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          or(
            isNull(users.premiumExpiresAt),
            lte(users.premiumExpiresAt, now)
          )
        )
      );

    if (expiredUsers.length === 0) return;

    // 2. Corriger en BDD -> isPremium = false
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
          or(
            isNull(users.premiumExpiresAt),
            lte(users.premiumExpiresAt, now)
          )
        )
      );

    // 3. Envoyer la notif de relance
    for (const u of expiredUsers) {
      try {
        await db.insert(notifications).values({
          userId: u.id,
          type: "premium_expired",
          content: "💔 Ton abonnement Premium a expiré ! Tes avantages VIP sont suspendus. Réabonne-toi vite pour continuer à profiter de LoveLink !",
          isRead: false,
        });

        await sendPushToUser(u.id, {
          title: "💔 Ton Premium a expiré !",
          body: `${u.firstName}, relance ton Premium pour continuer à voir qui t'a liké et booster tes matchs !`,
          icon: "/icon",
          tag: "premium_expired",
          url: "/premium",
        });
      } catch (e) {
        console.error("Notif expiration error:", e);
      }
    }
  } catch (error) {
    console.error("[Premium Cleanup] Error:", error);
  }
}
