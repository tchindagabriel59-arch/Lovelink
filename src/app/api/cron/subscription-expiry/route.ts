import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, gte, lt, isNotNull } from "drizzle-orm";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Évite d'envoyer 2x la même notif */
async function alreadyNotified(
  userId: number,
  type: string,
  withinHours: number
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, type),
        gte(notifications.createdAt, since)
      )
    )
    .limit(1);
  return !!row;
}

async function notifyUser(
  userId: number,
  type: string,
  content: string,
  pushPayload: { title: string; body: string; icon?: string; tag?: string; url?: string }
) {
  // Notif in-app
  await db.insert(notifications).values({
    userId,
    type,
    content,
    isRead: false,
  });

  // Push mobile
  await sendPushToUser(userId, pushPayload);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";

    if (cronSecret) {
      const ok = isVercelCron || authHeader === `Bearer ${cronSecret}`;
      if (!ok) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    const now = new Date();
    const results = {
      premiumExpiring3d: 0,
      premiumExpiring1d: 0,
      premiumExpired: 0,
      boostExpiringSoon: 0,
      boostExpired: 0,
    };

    // 👑 PREMIUM J-3
    const in2_5d = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
    const in3_5d = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

    const premium3d = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        premiumExpiresAt: users.premiumExpiresAt,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          isNotNull(users.premiumExpiresAt),
          gte(users.premiumExpiresAt, in2_5d),
          lt(users.premiumExpiresAt, in3_5d)
        )
      );

    for (const u of premium3d) {
      if (await alreadyNotified(u.id, "premium_expiring_3d", 48)) continue;
      await notifyUser(
        u.id,
        "premium_expiring_3d",
        "Ton abonnement Premium expire dans 3 jours. Renouvelle pour garder tes avantages !",
        PushTemplates.premiumExpiring3d()
      );
      results.premiumExpiring3d++;
    }

    // 👑 PREMIUM J-1
    const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const in36h = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const premium1d = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        premiumExpiresAt: users.premiumExpiresAt,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          isNotNull(users.premiumExpiresAt),
          gte(users.premiumExpiresAt, in12h),
          lt(users.premiumExpiresAt, in36h)
        )
      );

    for (const u of premium1d) {
      if (await alreadyNotified(u.id, "premium_expiring_1d", 24)) continue;
      await notifyUser(
        u.id,
        "premium_expiring_1d",
        "Plus qu'1 jour de Premium ! Renouvelle avant expiration.",
        PushTemplates.premiumExpiring1d()
      );
      results.premiumExpiring1d++;
    }

    // 👑 PREMIUM EXPIRÉ
    const expiredPremium = await db
      .select({
        id: users.id,
        firstName: users.firstName,
      })
      .from(users)
      .where(
        and(
          eq(users.isPremium, true),
          isNotNull(users.premiumExpiresAt),
          lt(users.premiumExpiresAt, now)
        )
      );

    for (const u of expiredPremium) {
      await db
        .update(users)
        .set({ isPremium: false, isIncognito: false })
        .where(eq(users.id, u.id));

      if (await alreadyNotified(u.id, "premium_expired", 48)) continue;

      await notifyUser(
        u.id,
        "premium_expired",
        "Ton Premium est terminé. Ton badge et tes avantages sont désactivés.",
        PushTemplates.premiumExpired()
      );
      results.premiumExpired++;
    }

    // 🚀 BOOST BIENTÔT FINI (~2h)
    const in30m = new Date(now.getTime() + 30 * 60 * 1000);
    const in2h30 = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const boostSoon = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        boostEndAt: users.boostEndAt,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.boostEndAt),
          gte(users.boostEndAt, in30m),
          lt(users.boostEndAt, in2h30)
        )
      );

    for (const u of boostSoon) {
      if (await alreadyNotified(u.id, "boost_expiring_soon", 6)) continue;
      await notifyUser(
        u.id,
        "boost_expiring_soon",
        "Ton Boost se termine dans environ 2 heures. Prolonge-le pour rester visible !",
        PushTemplates.boostExpiringSoon()
      );
      results.boostExpiringSoon++;
    }

    // 🚀 BOOST EXPIRÉ
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const boostExpired = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        boostEndAt: users.boostEndAt,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.boostEndAt),
          lt(users.boostEndAt, now),
          gte(users.boostEndAt, threeHoursAgo)
        )
      );

    for (const u of boostExpired) {
      if (await alreadyNotified(u.id, "boost_expired", 12)) continue;

      await notifyUser(
        u.id,
        "boost_expired",
        "Ton Boost est terminé. Ton profil n'est plus mis en avant.",
        PushTemplates.boostExpired()
      );
      results.boostExpired++;
    }

    return NextResponse.json({
      success: true,
      at: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("[CRON subscription-expiry] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
