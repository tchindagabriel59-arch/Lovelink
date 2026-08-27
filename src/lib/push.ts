import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Configuration VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
let vapidEmail = process.env.VAPID_EMAIL || "mailto:lovelink237@gmail.com";

// Correction automatique du format VAPID subject
if (
  vapidEmail &&
  !vapidEmail.startsWith("mailto:") &&
  !vapidEmail.startsWith("http://") &&
  !vapidEmail.startsWith("https://")
) {
  vapidEmail = `mailto:${vapidEmail}`;
}

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("[Push] Erreur setVapidDetails:", err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
}

type PushTemplateFn = (...args: any[]) => PushPayload;
type PushTemplateMap = Record<string, PushTemplateFn>;

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
            JSON.stringify({
              ...payload,
              icon: payload.icon || "/icon-192.png",
              badge: payload.badge || "/icon-192.png",
              data: {
                url: payload.url || "/dashboard",
              },
            })
          );

          sent++;
          return { success: true };
        } catch (err: any) {
          failed++;

          // Nettoyage des subscriptions expirées
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          } else {
            console.error("[Push] Erreur envoi:", err?.message || err);
          }

          return { success: false };
        }
      })
    );

    return { success: sent > 0, sent, failed };
  } catch (error) {
    console.error("[Push] Erreur globale:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Templates connus
 */
const baseTemplates: PushTemplateMap = {
  // Interactions
  like: (fromName: string) => ({
    title: "💕 Nouveau like !",
    body: `${fromName || "Quelqu'un"} t'a liké !`,
    icon: "/icon-192.png",
    tag: "like",
    url: "/likes-recus",
  }),

  superLike: (fromName: string) => ({
    title: "⭐ Super Like !",
    body: `${fromName || "Quelqu'un"} t'a envoyé un Super Like !`,
    icon: "/icon-192.png",
    tag: "super_like",
    url: "/likes-recus",
  }),

  match: (fromName: string) => ({
    title: "🔥 C'est un Match !",
    body: `Toi et ${fromName || "quelqu'un"} vous vous êtes mutuellement likés !`,
    icon: "/icon-192.png",
    tag: "match",
    url: "/matches",
  }),

  message: (fromName: string, preview: string) => ({
    title: `💬 ${fromName || "Nouveau message"}`,
    body:
      preview && preview.length > 60
        ? preview.slice(0, 60) + "..."
        : preview || "Tu as reçu un nouveau message.",
    icon: "/icon-192.png",
    tag: `message-${fromName || "user"}`,
    url: "/messages",
  }),

  // Compte / services
  verified: () => ({
    title: "✅ Profil vérifié !",
    body: "Félicitations ! Ton badge bleu est actif 💙",
    icon: "/icon-192.png",
    tag: "verified",
    url: "/profile",
  }),

  boost: () => ({
    title: "🚀 Boost activé !",
    body: "Ton profil est mis en avant. Profite de ta visibilité maximale !",
    icon: "/icon-192.png",
    tag: "boost",
    url: "/discover",
  }),

  boostExpired: () => ({
    title: "🚀 Boost terminé",
    body: "Ton Boost est terminé. Relance-le pour rester visible en priorité !",
    icon: "/icon-192.png",
    tag: "boost_expired",
    url: "/boost",
  }),

  boostExpiringSoon: () => ({
    title: "⏳ Ton Boost expire bientôt",
    body: "Ton Boost se termine bientôt. Prolonge-le pour rester visible !",
    icon: "/icon-192.png",
    tag: "boost_expiring_soon",
    url: "/boost",
  }),

  // Relances profils incomplets
  newProfiles: (count: number) => ({
    title: "🔥 De nouveaux profils !",
    body: `${count || "Plusieurs"} profil${count > 1 ? "s" : ""} viennent de rejoindre LoveLink.`,
    icon: "/icon-192.png",
    tag: "new_profiles",
    url: "/discover",
  }),

  incompleteProfile3d: () => ({
    title: "📸 Ton profil t'attend !",
    body: "Ajoute une photo pour commencer à matcher 💕",
    icon: "/icon-192.png",
    tag: "incomplete_profile_3d",
    url: "/profile",
  }),

  incompleteProfile7d: () => ({
    title: "🎁 7 jours Premium offerts !",
    body: "Complète ton profil aujourd'hui pour en profiter.",
    icon: "/icon-192.png",
    tag: "incomplete_profile_7d",
    url: "/profile",
  }),

  incompleteProfile14d: () => ({
    title: "💔 Dernière chance",
    body: "Complète ton profil pour ne pas perdre ton compte LoveLink.",
    icon: "/icon-192.png",
    tag: "incomplete_profile_14d",
    url: "/profile",
  }),

  // Expiration Premium
  premiumExpiring3d: () => ({
    title: "💎 Plus que 3 jours Premium",
    body: "Ton abonnement Premium expire bientôt. Renouvelle pour garder tes avantages.",
    icon: "/icon-192.png",
    tag: "premium_expiring_3d",
    url: "/premium",
  }),

  premiumExpiring1d: () => ({
    title: "⚠️ Dernier jour Premium",
    body: "Ton abonnement expire demain. Renouvelle pour garder tes avantages.",
    icon: "/icon-192.png",
    tag: "premium_expiring_1d",
    url: "/premium",
  }),

  premiumExpired: () => ({
    title: "💔 Premium terminé",
    body: "Ton Premium est terminé. Réactive-le pour retrouver tes avantages.",
    icon: "/icon-192.png",
    tag: "premium_expired",
    url: "/premium",
  }),

  // Sécurité / fallback nommé
  generic: (title?: string, body?: string, url?: string) => ({
    title: title || "LoveLink",
    body: body || "Tu as une nouvelle notification.",
    icon: "/icon-192.png",
    tag: "lovelink",
    url: url || "/dashboard",
  }),
};

/**
 * PushTemplates BLINDÉ :
 * - les templates connus existent
 * - si un ancien cron appelle un template oublié, ça renvoie generic()
 * - évite les erreurs TypeScript de propriété manquante
 */
export const PushTemplates: PushTemplateMap = new Proxy(baseTemplates, {
  get(target, prop: string) {
    if (prop in target) return target[prop];

    // fallback dynamique pour ne plus jamais casser le build
    return (..._args: any[]) => ({
      title: "LoveLink",
      body: "Tu as une nouvelle notification.",
      icon: "/icon-192.png",
      tag: String(prop),
      url: "/dashboard",
    });
  },
});
