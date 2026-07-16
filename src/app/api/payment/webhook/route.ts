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

// ============================================
// GET /api/payment/webhook
// Sonde de santé (PayDunya vérifie que l'URL est joignable)
// ============================================
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

// ============================================
// POST /api/payment/webhook
// Reçoit les notifications de paiement de PayDunya (IPN)
// ============================================
export async function POST(req: NextRequest) {
  // ⚠️ IMPORTANT : Répondre HTTP 200 rapidement !

  try {
    // 1. Récupérer le payload (peut être JSON ou form-data selon config PayDunya)
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // PayDunya envoie parfois en form-data
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());

      // Parser les champs data en JSON si présents
      if (typeof body.data === "string") {
        try {
          body.data = JSON.parse(body.data);
        } catch {
          // Garder tel quel
        }
      }
    }

    console.log("📩 Webhook PayDunya reçu:", JSON.stringify(body));

    // 2. Extraire les infos importantes
    // PayDunya envoie : data (objet) OU custom_data + invoice.token
    const data = body.data || body;
    const token =
      data.invoice?.token ||
      data.token ||
      body.token ||
      body["data[invoice][token]"];

    const customData =
      data.custom_data ||
      body.custom_data ||
      {};

    const merchantTransactionId =
      customData.merchant_transaction_id ||
      body["data[custom_data][merchant_transaction_id]"];

    // 3. Validation basique
    if (!token && !merchantTransactionId) {
      console.warn("⚠️ Webhook payload incomplet - pas de token ni merchant_id");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 4. Retrouver le paiement en base
    // On cherche d'abord par merchant_transaction_id, sinon par token PayDunya
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
      console.warn(
        `⚠️ Paiement introuvable - merchant_id=${merchantTransactionId}, token=${token}`
      );
      // On répond 200 quand même (PayDunya ne doit pas retenter à l'infini)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 5. IDEMPOTENCE : si déjà traité, ignorer
    if (payment.status === "success" || payment.status === "failed") {
      console.log(
        `ℹ️ Paiement déjà traité: ${payment.merchantTransactionId} (${payment.status})`
      );
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Marquer le webhook comme reçu
    await db
      .update(payments)
      .set({
        webhookReceivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // 7. 🔒 SÉCURITÉ CRITIQUE : NE JAMAIS faire confiance au payload webhook !
    // Toujours re-vérifier via l'API PayDunya (source de vérité)
    const verifyToken = payment.paymentToken || token;

    if (!verifyToken) {
      console.error("❌ Pas de token pour vérifier le paiement");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    let verifyResponse;
    try {
      verifyResponse = await verifyPayDunyaInvoice(verifyToken);
    } catch (verifyError) {
      console.error("❌ Erreur vérification PayDunya:", verifyError);
      // On répond 200 mais on ne finalise pas (retentera via success_url ou cron)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const realStatus = verifyResponse.status;
    console.log(
      `🔍 Statut réel PayDunya pour ${payment.merchantTransactionId}: ${realStatus}`
    );

    // 8. Traiter selon le statut réel
    if (realStatus === "completed") {
      // ✅ PAIEMENT RÉUSSI → Activer le Premium
      await activatePremium(payment.id, verifyResponse);
      console.log(
        `✅ Premium activé pour user ${payment.userId} (${payment.plan} ${payment.billingPeriod})`
      );
    } else if (realStatus === "cancelled" || realStatus === "failed") {
      // ❌ PAIEMENT ÉCHOUÉ / ANNULÉ
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
      // ⏳ PENDING → on attend
      console.log(
        `⏳ Paiement en attente: ${payment.merchantTransactionId} (${realStatus})`
      );
    }

    // 9. Toujours répondre 200 à PayDunya
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erreur webhook PayDunya:", error);
    // Même en cas d'erreur, on répond 200 pour éviter les retries infinis
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ============================================
// 💎 ACTIVER LE PREMIUM
// ============================================
async function activatePremium(paymentId: number, verifyResponse: any) {
  try {
    // 1. Récupérer le paiement
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      console.error(`❌ Paiement ${paymentId} introuvable pour activation`);
      return;
    }

    // 2. Récupérer l'utilisateur
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) {
      console.error(`❌ User ${payment.userId} introuvable`);
      return;
    }

    // 3. Calculer la date d'expiration
    // Si l'user a déjà un Premium actif, on prolonge à partir de son expiration
    let expiresAt: Date;
    const now = new Date();

    if (
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) > now
    ) {
      // Prolongation
      const currentExpiry = new Date(user.premiumExpiresAt);
      if (payment.billingPeriod === "monthly") {
        currentExpiry.setMonth(currentExpiry.getMonth() + 1);
      } else {
        currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      }
      expiresAt = currentExpiry;
    } else {
      // Nouveau
      expiresAt = getSubscriptionExpiryDate(payment.billingPeriod as BillingPeriod);
    }

    // 4. Créer la subscription
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

    // 5. Mettre à jour le user (isPremium + expiration + plan)
    await db
      .update(users)
      .set({
        isPremium: true,
        premiumExpiresAt: expiresAt,
        premiumPlan: payment.plan,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payment.userId));

    // 6. Mettre à jour le paiement (status success + subscription liée + méthode paiement)
    await db
      .update(payments)
      .set({
        status: "success",
        subscriptionId: subscription.id,
        statusMessage: "Paiement réussi - Premium activé",
        paymentMethod: verifyResponse.customer?.name || verifyResponse.mode || null,
        cinetpayTransactionId:
          verifyResponse.receipt_identifier ||
          verifyResponse.provider_reference ||
          payment.paymentToken,
        completedAt: now,
        verifiedAt: now,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    // 7. 📧 Envoyer un email de confirmation (silencieux)
    try {
      const planLabel = payment.plan === "premium" ? "Premium" : "Gold";
      const periodLabel = payment.billingPeriod === "monthly" ? "1 mois" : "1 an";
      await sendMatchEmail(
        user.email,
        user.firstName,
        `LoveLink ${planLabel} activé (${periodLabel})`
      );
    } catch (emailError) {
      console.error("⚠️ Erreur envoi email confirmation:", emailError);
      // On ne bloque pas si l'email échoue
    }

    console.log(
      `🎉 Premium ${payment.plan} activé pour user ${payment.userId} jusqu'au ${expiresAt.toISOString()}`
    );
  } catch (error) {
    console.error("❌ Erreur activatePremium:", error);
    throw error;
  }
}
