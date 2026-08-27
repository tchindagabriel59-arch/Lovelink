import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Configuration VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
let vapidEmail = process.env.VAPID_EMAIL || "mailto:lovelink237@gmail.com";

// 🛡️ SÉCURISATION AUTOMATIQUE DU FORMAT MAILTO
if (vapidEmail && !vapidEmail.startsWith("mailto:") && !vapidEmail.startsWith("http")) {
  vapidEmail = `mailto:${vapidEmail}`;
}

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("[Push] Erreur setVapidDetails:", err);
  }
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
        } catch (err: any) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
          return { success: false };
        }
      })
    );

    return { success: sent > 0, sent, failed };
  } catch (error) {
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Templates de notifications (N'EN SUPPRIME AUCUN)
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

  // 🔄 TEMPLATES POUR LES RELANCES (CRON JOBS)
  newProfiles: (count: number) => ({
    title: "🔥 De nouveaux profils !",
    body: `${count} personne${count > 1 ? "s viennent" : " vient"} de nous rejoindre.`,
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
    body: "Complète ton profil aujourd'hui pour en profiter !",
    icon: "/icon",
    tag: "incomplete_profile",
    url: "/profile",
  }),

  incompleteProfile14d: () => ({
    title: "💔 On va bientôt te supprimer...",
    body: "Dernière chance ! Complète ton profil vite 😢",
    icon: "/icon",
    tag: "incomplete_profile",
    url: "/profile",
  }),
};
