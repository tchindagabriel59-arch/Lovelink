import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

export async function cleanupExpiredPremium() {
  try {
    const now = new Date();

    // 1. Récupérer les abonnés dont la date est dépassée
    const expiredUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          isNotNull(users.premiumExpiresAt),
          lte(users.premiumExpiresAt, now)
        )
      );

    if (expiredUsers.length === 0) return;

    // 2. Basculer isPremium = false (ON GARDE premiumPlan & premiumExpiresAt pour l'historique admin)
    await db
      .update(users)
      .set({
        isPremium: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(users.isPremium, true),
          isNotNull(users.premiumExpiresAt),
          lte(users.premiumExpiresAt, now)
        )
      );

    // 3. Envoyer la notif in-app + Push
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
