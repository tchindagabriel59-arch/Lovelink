import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, subscriptions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPayDunyaInvoice } from "@/lib/paydunya";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const token =
      payload?.data?.hash ||
      payload?.invoice?.token ||
      payload?.token ||
      req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // 1) Vérification officielle côté PayDunya
    const verification = await verifyPayDunyaInvoice(token);

    if (!verification?.invoice?.token) {
      return NextResponse.json({ error: "Facture non vérifiée" }, { status: 400 });
    }

    const invoiceToken = verification.invoice.token;

    // 2) Retrouver le paiement local
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentToken, invoiceToken))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // 3) Déjà traité ? (idempotent)
    // ⚠️ On accepte "success" ET "completed" pour rétrocompat
    if (payment.status === "success" || payment.status === "completed") {
      return NextResponse.json({ success: true, message: "Déjà traité" });
    }

    const providerStatus = String(verification.status || "").toLowerCase();
    const now = new Date();

    // 4) Paiement validé
    if (providerStatus === "completed" || providerStatus === "success") {
      const userId = Number(payment.userId);

      // ═══════════════════════════════════════
      // 🚀 BOOST
      // ═══════════════════════════════════════
      if (payment.plan === "boost") {
        let addHours = 24;
        if (payment.billingPeriod === "3d") addHours = 72;
        if (payment.billingPeriod === "7d") addHours = 168;

        const [user] = await db
          .select({ boostEndAt: users.boostEndAt })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        // Empile sur le boost restant s'il est encore actif
        let newBoostEndAt = new Date(now);
        if (user?.boostEndAt && new Date(user.boostEndAt) > now) {
          newBoostEndAt = new Date(user.boostEndAt);
        }
        newBoostEndAt = new Date(newBoostEndAt.getTime() + addHours * 60 * 60 * 1000);

        await db
          .update(users)
          .set({
            boostEndAt: newBoostEndAt,
            lastBoostAt: now,
            updatedAt: now,
          })
          .where(eq(users.id, userId));

        // Notifs
        try {
          await db.insert(notifications).values({
            userId,
            type: "boost_activated",
            content: "🚀 Ton Boost est activé ! Ton profil est mis en avant.",
            isRead: false,
          });
          await sendPushToUser(userId, PushTemplates.boost());
        } catch (e) {
          console.error("Notif boost error:", e);
        }
      }

      // ═══════════════════════════════════════
      // 💎 PREMIUM / GOLD
      // ═══════════════════════════════════════
      else {
        const [user] = await db
          .select({
            isPremium: users.isPremium,
            premiumExpiresAt: users.premiumExpiresAt,
            premiumPlan: users.premiumPlan,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        // Point de départ = maintenant OU fin d'abo actuel s'il est encore valide
        let base = now;
        if (
          user?.isPremium &&
          user.premiumExpiresAt &&
          new Date(user.premiumExpiresAt) > now
        ) {
          base = new Date(user.premiumExpiresAt);
        }

        const expiryDate = new Date(base);
        const period = String(payment.billingPeriod || "monthly").toLowerCase();

        if (period === "yearly" || period === "1year" || period === "year") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else if (period === "3months" || period === "quarterly") {
          expiryDate.setMonth(expiryDate.getMonth() + 3);
        } else if (period === "6months") {
          expiryDate.setMonth(expiryDate.getMonth() + 6);
        } else {
          // monthly par défaut
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        const plan = payment.plan === "gold" ? "gold" : "premium";

        await db
          .update(users)
          .set({
            isPremium: true,
            premiumPlan: plan,
            premiumExpiresAt: expiryDate,
            updatedAt: now,
          })
          .where(eq(users.id, userId));

        // Tracking subscription
        try {
          await db.insert(subscriptions).values({
            userId,
            plan,
            billingPeriod:
              period === "yearly" || period === "1year" || period === "year"
                ? "yearly"
                : "monthly",
            amount: payment.amount || 0,
            currency: payment.currency || "XOF",
            status: "active",
            startsAt: now,
            expiresAt: expiryDate,
            autoRenew: false,
          });
        } catch (e) {
          console.error("Subscription insert error:", e);
        }

        // Notifs
        try {
          await db.insert(notifications).values({
            userId,
            type: "premium_activated",
            content: `💎 Ton ${plan === "gold" ? "Gold" : "Premium"} est activé jusqu'au ${expiryDate.toLocaleDateString("fr-FR")} !`,
            isRead: false,
          });

          await sendPushToUser(userId, {
            title: plan === "gold" ? "🏆 Gold activé !" : "💎 Premium activé !",
            body: `Ton abonnement est actif jusqu'au ${expiryDate.toLocaleDateString("fr-FR")}. Profite !`,
            icon: "/icon",
            tag: "premium_activated",
            url: "/premium",
          });
        } catch (e) {
          console.error("Notif premium error:", e);
        }
      }

      // 5) Marquer le paiement SUCCESS (aligné avec tes stats admin)
      await db
        .update(payments)
        .set({
          status: "success",
          completedAt: now,
          verifiedAt: now,
          webhookReceivedAt: now,
          updatedAt: now,
          statusMessage: "PayDunya confirmed",
        } as any)
        .where(eq(payments.id, payment.id));

      return NextResponse.json({ success: true, activated: true });
    }

    // 6) Échec / annulation
    const failedStatus =
      providerStatus === "cancelled" || providerStatus === "canceled"
        ? "cancelled"
        : "failed";

    await db
      .update(payments)
      .set({
        status: failedStatus,
        webhookReceivedAt: now,
        updatedAt: now,
        statusMessage: `PayDunya status: ${providerStatus}`,
      } as any)
      .where(eq(payments.id, payment.id));

    return NextResponse.json({ success: true, activated: false, status: failedStatus });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}

// Certains providers appellent en GET avec ?token=
export async function GET(req: NextRequest) {
  return POST(req);
}
