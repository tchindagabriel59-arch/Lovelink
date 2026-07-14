import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyCinetPayPayment,
  getSubscriptionExpiryDate,
  type PremiumPlan,
  type BillingPeriod,
} from "@/lib/cinetpay";
import { sendMatchEmail } from "@/lib/emails";

// ============================================
// GET /api/payment/webhook
// Sonde de santé (CinetPay vérifie que l'URL est joignable)
// ============================================
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

// ============================================
// POST /api/payment/webhook
// Reçoit les notifications de paiement de CinetPay (IPN)
// ============================================
export async function POST(req: NextRequest) {
  // ⚠️ IMPORTANT : Répondre HTTP 200 dans les 10 secondes !
  // Sinon CinetPay retente et on peut avoir des doublons.

  try {
    // 1. Récupérer le payload
    const body = await req.json();
    console.log("📩 Webhook CinetPay reçu:", body);

    const {
      notify_token,
      merchant_transaction_id,
      transaction_id,
    } = body;

    // 2. Validation basique
    if (!merchant_transaction_id || !transaction_id) {
      console.warn("⚠️ Webhook payload incomplet");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3. Retrouver le paiement en base
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.merchantTransactionId, merchant_transaction_id))
      .limit(1);

    if (!payment) {
      console.warn(`⚠️ Paiement introuvable: ${merchant_transaction_id}`);
      // On répond 200 quand même (CinetPay ne doit pas retenter à l'infini)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 4. IDEMPOTENCE : si déjà traité, ignorer
    if (payment.status === "success" || payment.status === "failed") {
      console.log(`ℹ️ Paiement déjà traité: ${merchant_transaction_id} (${payment.status})`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 5. SÉCURITÉ : Vérifier le notify_token
    if (payment.notifyToken && notify_token && payment.notifyToken !== notify_token) {
      console.error(`❌ notify_token invalide pour ${merchant_transaction_id}`);
      // On répond 200 mais on ne traite pas (protection contre attaques)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 6. Marquer le webhook comme reçu
    await db
      .update(payments)
      .set({
        webhookReceivedAt: new Date(),
        cinetpayTransactionId: transaction_id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // 7. 🔒 SÉCURITÉ CRITIQUE : NE JAMAIS faire confiance au payload webhook !
    // Toujours re-vérifier via l'API CinetPay (source de vérité)
    let verifyResponse;
    try {
      verifyResponse = await verifyCinetPayPayment(merchant_transaction_id);
    } catch (verifyError) {
      console.error("❌ Erreur vérification CinetPay:", verifyError);
      // On répond 200 mais on ne finalise pas (on retentera via le success_url ou cron)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const paymentData = verifyResponse.data;
    const realStatus = paymentData?.status || "UNKNOWN";

    console.log(`🔍 Statut réel CinetPay pour ${merchant_transaction_id}: ${realStatus}`);

    // 8. Traiter selon le statut réel
    if (realStatus === "SUCCESS") {
      // ✅ PAIEMENT RÉUSSI → Activer le Premium
      await activatePremium(payment.id);
      console.log(`✅ Premium activé pour user ${payment.userId} (${payment.plan} ${payment.billingPeriod})`);
    } else if (realStatus === "FAILED" || realStatus === "CANCELLED") {
      // ❌ PAIEMENT ÉCHOUÉ
      await db
        .update(payments)
        .set({
          status: "failed",
          statusMessage: verifyResponse.message || "Paiement échoué",
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      console.log(`❌ Paiement échoué: ${merchant_transaction_id}`);
    } else {
      // ⏳ PENDING / WAITING → on attend
      console.log(`⏳ Paiement en attente: ${merchant_transaction_id} (${realStatus})`);
    }

    // 9. Toujours répondre 200 à CinetPay
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erreur webhook CinetPay:", error);
    // Même en cas d'erreur, on répond 200 pour éviter les retries infinis
    // (On log l'erreur pour investigation)
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ============================================
// 💎 ACTIVER LE PREMIUM
// ============================================
async function activatePremium(paymentId: number) {
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
    // Si l'user a déjà un Premium, on ajoute la période à partir de son expiration actuelle
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

    // 6. Mettre à jour le paiement (status success + subscription liée)
    await db
      .update(payments)
      .set({
        status: "success",
        subscriptionId: subscription.id,
        statusMessage: "Paiement réussi - Premium activé",
        completedAt: now,
        verifiedAt: now,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    // 7. 📧 Envoyer un email de confirmation (silencieux)
    try {
      const planLabel = payment.plan === "premium" ? "Premium" : "Gold";
      const periodLabel = payment.billingPeriod === "monthly" ? "1 mois" : "1 an";
      // On réutilise le template match pour l'instant (à améliorer plus tard)
      await sendMatchEmail(
        user.email,
        user.firstName,
        `LoveLink ${planLabel} activé (${periodLabel})`
      );
    } catch (emailError) {
      console.error("⚠️ Erreur envoi email confirmation:", emailError);
      // On ne bloque pas si l'email échoue
    }

    console.log(`🎉 Premium ${payment.plan} activé pour user ${payment.userId} jusqu'au ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error("❌ Erreur activatePremium:", error);
    throw error;
  }
}
