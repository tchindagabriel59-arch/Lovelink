import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

/**
 * Nettoie les abonnements expirés, désactive isPremium 
 * et envoie une notification de relance/séduction à l'utilisateur.
 */
export async function cleanupExpiredPremium() {
  try {
    const now = new Date();

    // 1. Récupérer la liste des abonnés expirés
    const expiredUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          lte(users.premiumExpiresAt, now)
        )
      );

    if (expiredUsers.length === 0) return;

    // 2. Passer isPremium à false en BDD
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

    // 3. Envoyer la notification in-app + Push de séduction à chaque membre expiré
    for (const u of expiredUsers) {
      try {
        await db.insert(notifications).values({
          userId: u.id,
          type: "premium_expired",
          content: "💔 Ton abonnement Premium a expiré ! Tes avantages (likes vus, visibilité) sont suspendus. Réabonne-toi vite pour ne rien rater !",
          isRead: false,
        });

        await sendPushToUser(u.id, {
          title: "💔 Ton Premium LoveLink a expiré !",
          body: `${u.firstName}, relance ton Premium pour continuer à voir qui t'a liké et booster tes matchs !`,
          icon: "/icon",
          tag: "premium_expired",
          url: "/premium",
        });
      } catch (e) {
        console.error("Erreur notif expiration:", e);
      }
    }
  } catch (error) {
    console.error("[Premium Cleanup] Erreur lors du nettoyage :", error);
  }
}
