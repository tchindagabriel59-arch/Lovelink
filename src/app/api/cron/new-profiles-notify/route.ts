import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, pushSubscriptions, notifications } from "@/db/schema";
import { and, eq, gte, lte, isNotNull, ne, sql, inArray } from "drizzle-orm";
import { sendPushToUser, PushTemplates } from "@/lib/push";

// Protection : Ce endpoint est appelé UNIQUEMENT par cron-job.org
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    // 🔐 Vérification du token
    const authHeader = req.headers.get("authorization");
    const providedToken = authHeader?.replace("Bearer ", "");

    if (!CRON_SECRET || providedToken !== CRON_SECRET) {
      console.log("[Cron NewProfiles] Token invalide");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron NewProfiles] Démarrage...");

    // 📊 Compter les nouveaux profils des dernières 24h AVEC PHOTO
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const newProfilesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          gte(users.createdAt, oneDayAgo),
          eq(users.isBanned, false),
          isNotNull(users.photoUrl),
          ne(users.photoUrl, ""),
          sql`${users.photoUrl} LIKE 'http%'`
        )
      );

    const newProfilesCount = newProfilesResult[0]?.count || 0;

    console.log(`[Cron NewProfiles] ${newProfilesCount} nouveaux profils (24h)`);

    // ⚠️ Seuil minimum : au moins 5 nouveaux profils pour envoyer
    const MIN_NEW_PROFILES = 5;
    if (newProfilesCount < MIN_NEW_PROFILES) {
      return NextResponse.json({
        success: true,
        message: `Seulement ${newProfilesCount} nouveaux profils (minimum ${MIN_NEW_PROFILES})`,
        notified: 0,
      });
    }

    // 👥 Chercher les users INACTIFS (dernière connexion > 12h)
    // Mais pas trop inactifs non plus (< 30 jours pour éviter le spam sur les morts)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 🚫 Ne pas notifier ceux déjà notifiés dans les dernières 24h
    const oneDayAgoForNotif = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alreadyNotified = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "new_profiles_push"),
          gte(notifications.createdAt, oneDayAgoForNotif)
        )
      );

    const excludeUserIds = alreadyNotified.map((n) => n.userId);

    // 🎯 Users éligibles : inactifs mais pas trop, avec photo, pas bannis, pas déjà notifiés
    const inactiveUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
      })
      .from(users)
      .where(
        and(
          lte(users.lastSeen, twelveHoursAgo),
          gte(users.lastSeen, thirtyDaysAgo),
          eq(users.isBanned, false),
          isNotNull(users.photoUrl),
          ne(users.photoUrl, ""),
          excludeUserIds.length > 0
            ? sql`${users.id} NOT IN (${sql.join(excludeUserIds.map((id) => sql`${id}`), sql`, `)})`
            : sql`1=1`
        )
      )
      .limit(500); // Limite de sécurité

    console.log(`[Cron NewProfiles] ${inactiveUsers.length} users inactifs éligibles`);

    if (inactiveUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun user inactif à notifier",
        notified: 0,
      });
    }

    // 🚀 Envoyer les push notifications
    const template = PushTemplates.newProfiles(newProfilesCount);
    let sentCount = 0;
    let failedCount = 0;

    // Traiter par batch de 20 pour éviter de saturer
    const BATCH_SIZE = 20;
    for (let i = 0; i < inactiveUsers.length; i += BATCH_SIZE) {
      const batch = inactiveUsers.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          const result = await sendPushToUser(user.id, template);
          
          // Enregistrer la notification pour ne pas re-notifier
          if (result.success && result.sent > 0) {
            await db.insert(notifications).values({
              userId: user.id,
              type: "new_profiles_push",
              content: `${newProfilesCount} nouveaux profils`,
              isRead: false,
            });
            return { success: true };
          }
          return { success: false };
        })
      );

      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value.success) sentCount++;
        else failedCount++;
      });
    }

    console.log(
      `[Cron NewProfiles] ✅ Terminé : ${sentCount} envoyés, ${failedCount} échecs`
    );

    return NextResponse.json({
      success: true,
      newProfilesCount,
      eligibleUsers: inactiveUsers.length,
      notified: sentCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error("[Cron NewProfiles] Erreur:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur serveur", details: errorMessage },
      { status: 500 }
    );
  }
}
