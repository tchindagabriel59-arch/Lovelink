import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Configuration VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:lovelink237@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
}

/**
 * Envoie une notification push à un utilisateur
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          );
          sent++;
          return { success: true };
        } catch (err: unknown) {
          failed++;
          const error = err as { statusCode?: number };

          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log("[Push] Suppression abonnement expiré:", sub.endpoint);
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          } else {
            console.error("[Push] Erreur envoi:", err);
          }
          return { success: false };
        }
      })
    );

    console.log(`[Push] Envoyé à user ${userId}: ${sent} réussis, ${failed} échecs`);

    return {
      success: sent > 0,
      sent,
      failed,
    };
  } catch (error) {
    console.error("[Push] Erreur globale:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Templates de notifications prêts à l'emploi
 */
export const PushTemplates = {
  like: (fromName: string) => ({
    title: "💕 Nouveau like !",
    body: `${fromName} t'a liké !`,
    icon: "/icon",
    tag: "like",
    url: "/likes-recus",
  }),

  superLike: (fromName: string) => ({
    title: "⭐ Super Like !",
    body: `${fromName} t'a envoyé un Super Like !`,
    icon: "/icon",
    tag: "super_like",
    url: "/likes-recus",
  }),

  match: (fromName: string) => ({
    title: "🔥 C'est un Match !",
    body: `Toi et ${fromName} vous êtes mutuellement likés !`,
    icon: "/icon",
    tag: "match",
    url: "/matches",
  }),

  message: (fromName: string, preview: string) => ({
    title: `💬 ${fromName}`,
    body: preview.length > 60 ? preview.slice(0, 60) + "..." : preview,
    icon: "/icon",
    tag: `message-${fromName}`,
    url: "/messages",
  }),

  verified: () => ({
    title: "✅ Profil Vérifié !",
    body: "Félicitations ! Ton badge bleu est actif 💙",
    icon: "/icon",
    tag: "verified",
    url: "/profile",
  }),

  boost: () => ({
    title: "🚀 Boost activé !",
    body: "Ton profil est mis en avant ! Profite de ta visibilité max !",
    icon: "/icon",
    tag: "boost",
    url: "/discover",
  }),

  newProfiles: (count: number) => ({
    title: "🔥 De nouveaux profils !",
    body: `${count} personne${count > 1 ? "s viennent" : " vient"} de rejoindre LoveLink. Découvre-${count > 1 ? "les" : "la"} !`,
    icon: "/icon",
    tag: "new_profiles",
    url: "/discover",
  }),

  incompleteProfile3d: () => ({
    title: "📸 Ton profil t'attend !",
    body: "Ajoute une photo pour commencer à matcher 💕",
    icon: "/icon",
    tag: "incomplete_profile",
    url: "/profile",
  }),

  incompleteProfile7d: () => ({
    title: "🎁 7 jours Premium OFFERTS !",
    body: "Complète ton profil aujourd'hui et débloque Premium gratuit !",
    icon: "/icon",
    tag: "incomplete_profile",
    url: "/profile",
  }),

  incompleteProfile14d: () => ({
    title: "💔 On va bientôt te supprimer...",
    body: "Dernière chance ! Complète ton profil ou perds ton compte 😢",
    icon: "/icon",
    tag: "incomplete_profile",
    url: "/profile",
  }),

  // 👑 EXPIRATION PREMIUM & BOOST
  premiumExpiring3d: () => ({
    title: "⏰ Ton Premium expire dans 3 jours",
    body: "Renouvelle maintenant pour garder tes avantages 💎",
    icon: "/icon",
    tag: "premium_expiring_3d",
    url: "/premium",
  }),

  premiumExpiring1d: () => ({
    title: "🚨 Premium : plus qu'1 jour !",
    body: "Dernière ligne droite… renouvelle pour ne rien perdre 👑",
    icon: "/icon",
    tag: "premium_expiring_1d",
    url: "/premium",
  }),

  premiumExpired: () => ({
    title: "😢 Ton Premium est terminé",
    body: "Ton badge et tes avantages sont désactivés. Renouvelle en 1 clic !",
    icon: "/icon",
    tag: "premium_expired",
    url: "/premium",
  }),

  boostExpiringSoon: () => ({
    title: "⚡ Ton Boost se termine bientôt",
    body: "Plus que ~2h de visibilité max. Prolonge ton Boost !",
    icon: "/icon",
    tag: "boost_expiring_soon",
    url: "/boost",
  }),

  boostExpired: () => ({
    title: "🚀 Ton Boost est terminé",
    body: "Ton profil n'est plus mis en avant. Relance un Boost pour rester visible !",
    icon: "/icon",
    tag: "boost_expired",
    url: "/boost",
  }),
};
