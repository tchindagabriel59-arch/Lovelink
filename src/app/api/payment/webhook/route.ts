import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPayDunyaInvoice,
  getSubscriptionExpiryDate,
  type BillingPeriod,
} from "@/lib/paydunya";
import { sendMatchEmail } from "@/lib/emails";
import { sendMetaEvent, getClientIp, generateEventId } from "@/lib/meta-capi";

// ============================================
// GET /api/payment/webhook
// ============================================
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

// ============================================
// POST /api/payment/webhook
// ============================================
export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      if (typeof body.data === "string") {
        try {
          body.data = JSON.parse(body.data);
        } catch {
          // Garder tel quel
        }
      }
    }

    console.log("📩 Webhook PayDunya reçu:", JSON.stringify(body));

    const data = body.data || body;
    const token =
      data.invoice?.token ||
      data.token ||
      body.token ||
      body["data[invoice][token]"];

    const customData = data.custom_data || body.custom_data || {};
    const merchantTransactionId =
      customData.merchant_transaction_id ||
      body["data[custom_data][merchant_transaction_id]"];

    if (!token && !merchantTransactionId) {
      console.warn("⚠️ Webhook payload incomplet");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    let payment;
    if (merchantTransactionId) {
      [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.merchantTransactionId, merchantTransactionId))
        .limit(1);
    }

    if (!payment && token) {
      [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.paymentToken, token))
        .limit(1);
    }

    if (!payment) {
      console.warn(`⚠️ Paiement introuvable`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (payment.status === "success" || payment.status === "failed") {
      console.log(`ℹ️ Paiement déjà traité: ${payment.merchantTransactionId}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await db
      .update(payments)
      .set({ webhookReceivedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    const verifyToken = payment.paymentToken || token;
    if (!verifyToken) {
      console.error("❌ Pas de token pour vérifier");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    let verifyResponse;
    try {
      verifyResponse = await verifyPayDunyaInvoice(verifyToken);
    } catch (verifyError) {
      console.error("❌ Erreur vérification PayDunya:", verifyError);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const realStatus = verifyResponse.status;
    console.log(`🔍 Statut réel PayDunya: ${realStatus}`);

    if (realStatus === "completed") {
      // ✅ Générer l'eventId CAPI pour déduplication avec le Pixel frontend
      const capiEventId = generateEventId();
      await activatePremium(payment.id, verifyResponse, capiEventId, req);
      console.log(`✅ Premium activé pour user ${payment.userId}`);
    } else if (realStatus === "cancelled" || realStatus === "failed") {
      await db
        .update(payments)
        .set({
          status: "failed",
          statusMessage:
            verifyResponse.fail_reason ||
            verifyResponse.response_text ||
            "Paiement échoué",
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      console.log(`❌ Paiement échoué: ${payment.merchantTransactionId}`);
    } else {
      console.log(`⏳ Paiement en attente: ${realStatus}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erreur webhook PayDunya:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ============================================
// 💎 ACTIVER LE PREMIUM
// ============================================
async function activatePremium(
  paymentId: number,
  verifyResponse: any,
  capiEventId: string,
  req: NextRequest
) {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      console.error(`❌ Paiement ${paymentId} introuvable`);
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) {
      console.error(`❌ User ${payment.userId} introuvable`);
      return;
    }

    // Calculer la date d'expiration
    let expiresAt: Date;
    const now = new Date();

    if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
      const currentExpiry = new Date(user.premiumExpiresAt);
      if (payment.billingPeriod === "monthly") {
        currentExpiry.setMonth(currentExpiry.getMonth() + 1);
      } else {
        currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      }
      expiresAt = currentExpiry;
    } else {
      expiresAt = getSubscriptionExpiryDate(payment.billingPeriod as BillingPeriod);
    }

    // Créer la subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: payment.userId,
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
        amount: payment.amount,
        currency: payment.currency,
        status: "active",
        startsAt: now,
        expiresAt,
        autoRenew: false,
      })
      .returning();

    // Mettre à jour l'utilisateur
    await db
      .update(users)
      .set({
        isPremium: true,
        premiumExpiresAt: expiresAt,
        premiumPlan: payment.plan,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payment.userId));

    // Calculer le montant
    const prices: Record<string, Record<string, number>> = {
      premium: { monthly: 2500, yearly: 21000 },
      gold: { monthly: 5000, yearly: 42000 },
    };
    const priceFCFA =
      prices[payment.plan]?.[payment.billingPeriod] ||
      Number(payment.amount) ||
      2500;
    const priceUSD = Math.round((priceFCFA / 600) * 100) / 100;

    // Mettre à jour le paiement avec l'eventId CAPI
    await db
      .update(payments)
      .set({
        status: "success",
        subscriptionId: subscription.id,
        statusMessage: "Paiement réussi - Premium activé",
        paymentMethod:
          verifyResponse.customer?.name || verifyResponse.mode || null,
        cinetpayTransactionId:
          verifyResponse.receipt_identifier ||
          verifyResponse.provider_reference ||
          payment.paymentToken,
        completedAt: now,
        verifiedAt: now,
        updatedAt: now,
        // ✅ Stocker l'eventId pour que le frontend puisse l'utiliser
        metaEventId: capiEventId,
      })
      .where(eq(payments.id, paymentId));

    // 📊 META CAPI - Envoyer Purchase côté serveur
    sendMetaEvent({
      eventName: "Purchase",
      eventId: capiEventId,
      eventSourceUrl: "https://lovelink237.com/premium/success",
      userData: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clientIpAddress: getClientIp(req),
        clientUserAgent: req.headers.get("user-agent") || undefined,
      },
      customData: {
        currency: "XOF",
        value: priceFCFA,
        content_name: `LoveLink ${payment.plan}`,
        content_ids: [payment.plan],
        content_type: "product",
      },
    }).catch((err) => {
      console.error("[Meta CAPI] Erreur Purchase:", err);
    });

    console.log(`[Meta CAPI] ✅ Purchase envoyé - eventId: ${capiEventId}`);

    // 📧 Email de confirmation
    try {
      const planLabel = payment.plan === "premium" ? "Premium" : "Gold";
      const periodLabel =
        payment.billingPeriod === "monthly" ? "1 mois" : "1 an";
      await sendMatchEmail(
        user.email,
        user.firstName,
        `LoveLink ${planLabel} activé (${periodLabel})`
      );
    } catch (emailError) {
      console.error("⚠️ Erreur envoi email:", emailError);
    }

    console.log(
      `🎉 Premium ${payment.plan} activé pour user ${payment.userId} jusqu'au ${expiresAt.toISOString()}`
    );
  } catch (error) {
    console.error("❌ Erreur activatePremium:", error);
    throw error;
  }
}
