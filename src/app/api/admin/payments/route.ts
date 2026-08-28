import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, subscriptions, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { sendPushToUser, PushTemplates } from "@/lib/push";

// 1️⃣ GET : paiements en attente (manuel CM)
export async function GET() {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const pendingPayments = await db
      .select({
        payment: payments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
          email: users.email,
        },
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.status, "pending"))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({ pending: pendingPayments });
  } catch (error) {
    console.error("Erreur GET pending payments:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// 2️⃣ POST : Valider un paiement manuel → active Boost ou Premium
export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const paymentId = Number(body.paymentId);

    if (!paymentId || Number.isNaN(paymentId)) {
      return NextResponse.json({ error: "ID de paiement manquant" }, { status: 400 });
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // Déjà validé ?
    if (payment.status === "success" || payment.status === "completed") {
      return NextResponse.json({ success: true, message: "Déjà validé" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const now = new Date();
    const rawPlan = String(payment.plan || "").toLowerCase();
    const rawPeriod = String(payment.billingPeriod || "").toLowerCase();
    const isBoost = rawPlan.includes("boost");

    // ═══════════════════════════════════════
    // 🚀 BOOST
    // ═══════════════════════════════════════
    if (isBoost) {
      let hoursToAdd = 24;
      if (
        rawPeriod.includes("3d") ||
        rawPeriod.includes("3j") ||
        rawPeriod === "3"
      ) {
        hoursToAdd = 72;
      } else if (
        rawPeriod.includes("7d") ||
        rawPeriod.includes("7j") ||
        rawPeriod === "7"
      ) {
        hoursToAdd = 168;
      }

      // Empile si boost encore actif (vrai champ = boostEndAt)
      let baseDate = now;
      if (user.boostEndAt) {
        const parsed = new Date(user.boostEndAt);
        if (!isNaN(parsed.getTime()) && parsed > now) {
          baseDate = parsed;
        }
      }

      const newBoostEndAt = new Date(
        baseDate.getTime() + hoursToAdd * 60 * 60 * 1000
      );

      await db
        .update(users)
        .set({
          boostEndAt: newBoostEndAt,
          lastBoostAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      // Notifs
      try {
        await db.insert(notifications).values({
          userId: user.id,
          type: "boost_activated",
          content: `🚀 Ton Boost est activé jusqu'au ${newBoostEndAt.toLocaleString("fr-FR")} !`,
          isRead: false,
        });
        await sendPushToUser(user.id, PushTemplates.boost());
      } catch (e) {
        console.error("Notif boost:", e);
      }

      await db
        .update(payments)
        .set({
          status: "success",
          completedAt: now,
          verifiedAt: now,
          updatedAt: now,
          statusMessage: "Validé manuellement (admin CM)",
        } as any)
        .where(eq(payments.id, paymentId));

      return NextResponse.json({
        success: true,
        type: "boost",
        boostEndAt: newBoostEndAt.toISOString(),
        message: `Boost activé (${hoursToAdd}h)`,
      });
    }

    // ═══════════════════════════════════════
    // 💎 PREMIUM / GOLD
    // ═══════════════════════════════════════
    const planName = rawPlan.includes("gold") ? "gold" : "premium";

    let monthsToAdd = 1;
    if (
      rawPeriod.includes("year") ||
      rawPeriod.includes("an") ||
      rawPeriod.includes("1y") ||
      rawPeriod === "yearly"
    ) {
      monthsToAdd = 12;
    } else if (rawPeriod.includes("3")) {
      monthsToAdd = 3;
    } else if (rawPeriod.includes("6")) {
      monthsToAdd = 6;
    }

    // Empile si premium encore actif
    let baseDate = now;
    if (user.isPremium && user.premiumExpiresAt) {
      const parsed = new Date(user.premiumExpiresAt);
      if (!isNaN(parsed.getTime()) && parsed > now) {
        baseDate = parsed;
      }
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

    await db
      .update(users)
      .set({
        isPremium: true,
        premiumPlan: planName,
        premiumExpiresAt: newExpiry,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    // Tracking subscription
    try {
      await db.insert(subscriptions).values({
        userId: user.id,
        plan: planName,
        billingPeriod: monthsToAdd >= 12 ? "yearly" : "monthly",
        amount: payment.amount || 0,
        currency: payment.currency || "XOF",
        status: "active",
        startsAt: now,
        expiresAt: newExpiry,
        autoRenew: false,
      });
    } catch (e) {
      console.error("Subscription insert:", e);
    }

    // Notifs
    try {
      await db.insert(notifications).values({
        userId: user.id,
        type: "premium_activated",
        content: `💎 Ton ${planName === "gold" ? "Gold" : "Premium"} est activé jusqu'au ${newExpiry.toLocaleDateString("fr-FR")} !`,
        isRead: false,
      });

      await sendPushToUser(user.id, {
        title: planName === "gold" ? "🏆 Gold activé !" : "💎 Premium activé !",
        body: `Abonnement actif jusqu'au ${newExpiry.toLocaleDateString("fr-FR")}. Profite !`,
        icon: "/icon",
        tag: "premium_activated",
        url: "/premium",
      });
    } catch (e) {
      console.error("Notif premium:", e);
    }

    await db
      .update(payments)
      .set({
        status: "success",
        completedAt: now,
        verifiedAt: now,
        updatedAt: now,
        statusMessage: "Validé manuellement (admin CM)",
      } as any)
      .where(eq(payments.id, paymentId));

    return NextResponse.json({
      success: true,
      type: "premium",
      plan: planName,
      premiumExpiresAt: newExpiry.toISOString(),
      message: `${planName} activé jusqu'au ${newExpiry.toLocaleDateString("fr-FR")}`,
    });
  } catch (error) {
    console.error("Erreur POST validate payment:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg || "Erreur serveur" }, { status: 500 });
  }
}

// 3️⃣ DELETE : supprimer un paiement abandonné
export async function DELETE(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await db.delete(payments).where(eq(payments.id, parseInt(paymentId, 10)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE payment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
