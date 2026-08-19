import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, gte, lte, or, sql, isNotNull } from "drizzle-orm";
import { sendPushToUser, PushTemplates } from "@/lib/push";
import {
  sendIncompleteProfileEmail3d,
  sendIncompleteProfileEmail7d,
  sendIncompleteProfileEmail14d,
} from "@/lib/emails";

const CRON_SECRET = process.env.CRON_SECRET || "";

// Calcule le nombre de jours entre 2 dates
function daysBetween(date1: Date, date2: Date): number {
  const diffMs = date2.getTime() - date1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Détermine si le profil est incomplet (multi-critères)
function isProfileIncomplete(user: {
  photoUrl: string | null;
  bio: string | null;
  city: string | null;
  interests: string | null;
}): boolean {
  const noPhoto = !user.photoUrl || user.photoUrl.trim() === "";
  const noBio = !user.bio || user.bio.trim().length < 10;
  const noCity = !user.city || user.city.trim() === "";
  const noInterests = !user.interests || user.interests.trim() === "";

  // Incomplet si au moins 2 critères manquants (dont photo obligatoire OU 2 autres)
  if (noPhoto) return true;
  const missingCount = [noBio, noCity, noInterests].filter(Boolean).length;
  return missingCount >= 2;
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Vérification token
    const authHeader = req.headers.get("authorization");
    const providedToken = authHeader?.replace("Bearer ", "");

    if (!CRON_SECRET || providedToken !== CRON_SECRET) {
      console.log("[Cron IncompleteProfiles] Token invalide");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron IncompleteProfiles] Démarrage...");

    // 📅 Chercher users inscrits entre J-15 et J-2
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // 🚫 Exclure ceux déjà notifiés dans les dernières 48h
    const twoDaysAgoForNotif = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const alreadyNotified = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "incomplete_profile"),
          gte(notifications.createdAt, twoDaysAgoForNotif)
        )
      );

    const excludeUserIds = alreadyNotified.map((n) => n.userId);

    // 🎯 Chercher users éligibles
    const eligibleUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        photoUrl: users.photoUrl,
        bio: users.bio,
        city: users.city,
        interests: users.interests,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          lte(users.createdAt, twoDaysAgo),
          gte(users.createdAt, fifteenDaysAgo),
          eq(users.isBanned, false),
          isNotNull(users.createdAt),
          excludeUserIds.length > 0
            ? sql`${users.id} NOT IN (${sql.join(excludeUserIds.map((id) => sql`${id}`), sql`, `)})`
            : sql`1=1`
        )
      )
      .limit(500);

    console.log(`[Cron IncompleteProfiles] ${eligibleUsers.length} users candidats`);

    let notified3d = 0;
    let notified7d = 0;
    let notified14d = 0;
    let skipped = 0;
    let errors = 0;

    // 🔄 Traiter chaque user
    for (const user of eligibleUsers) {
      try {
        // Skip si profil complet
        if (!isProfileIncomplete(user)) {
          skipped++;
          continue;
        }

        // Calcul du nombre de jours depuis inscription
        const createdAt = user.createdAt ? new Date(user.createdAt) : now;
        const daysSinceSignup = daysBetween(createdAt, now);

        // Déterminer quelle relance envoyer
        let pushTemplate: ReturnType<typeof PushTemplates.incompleteProfile3d> | null = null;
        let sendEmailFn: ((email: string, name: string) => Promise<unknown>) | null = null;
        let relanceType: string = "";

        if (daysSinceSignup >= 3 && daysSinceSignup < 5) {
          pushTemplate = PushTemplates.incompleteProfile3d();
          sendEmailFn = sendIncompleteProfileEmail3d;
          relanceType = "3d";
        } else if (daysSinceSignup >= 7 && daysSinceSignup < 9) {
          pushTemplate = PushTemplates.incompleteProfile7d();
          sendEmailFn = sendIncompleteProfileEmail7d;
          relanceType = "7d";
        } else if (daysSinceSignup >= 14 && daysSinceSignup < 16) {
          pushTemplate = PushTemplates.incompleteProfile14d();
          sendEmailFn = sendIncompleteProfileEmail14d;
          relanceType = "14d";
        } else {
          skipped++;
          continue;
        }

        // 📱 Envoyer push (silencieux si pas d'abonnement)
        try {
          await sendPushToUser(user.id, pushTemplate);
        } catch (err) {
          console.error(`[Cron] Push failed for user ${user.id}:`, err);
        }

        // 📧 Envoyer email
        try {
          await sendEmailFn(user.email, user.firstName);
        } catch (err) {
          console.error(`[Cron] Email failed for user ${user.id}:`, err);
        }

        // ✅ Enregistrer la notification
        await db.insert(notifications).values({
          userId: user.id,
          type: "incomplete_profile",
          content: `Relance ${relanceType} - Profil incomplet`,
          isRead: false,
        });

        // Compteurs
        if (relanceType === "3d") notified3d++;
        else if (relanceType === "7d") notified7d++;
        else if (relanceType === "14d") notified14d++;

        // Petit délai pour ne pas saturer Resend (100/j gratuit)
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`[Cron IncompleteProfiles] Erreur user ${user.id}:`, err);
        errors++;
      }
    }

    const total = notified3d + notified7d + notified14d;

    console.log(
      `[Cron IncompleteProfiles] ✅ Terminé: ${total} notifiés (J+3: ${notified3d}, J+7: ${notified7d}, J+14: ${notified14d}), ${skipped} skipped, ${errors} erreurs`
    );

    return NextResponse.json({
      success: true,
      total,
      notified3d,
      notified7d,
      notified14d,
      skipped,
      errors,
      eligible: eligibleUsers.length,
    });
  } catch (error) {
    console.error("[Cron IncompleteProfiles] Erreur:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur serveur", details: errorMessage },
      { status: 500 }
    );
  }
}
