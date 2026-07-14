import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import {
  verifyCinetPayPayment,
  getSubscriptionExpiryDate,
  type BillingPeriod,
} from "@/lib/cinetpay";

// ============================================
// GET /api/payment/verify?tx=xxx
// Vérifie manuellement le statut d'un paiement
// Utilisé par la page /premium/success au retour de CinetPay
// ============================================
export async function GET(req: NextRequest) {
  try {
    // 1. Vérifier que l'user est connecté
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // 2. Récupérer le merchant_transaction_id depuis l'URL
    const { searchParams } = new URL(req.url);
    const merchantTransactionId = searchParams.get("tx");

    if (!merchantTransactionId) {
      return NextResponse.json(
        { error: "Paramètre 'tx' manquant" },
        { status: 400 }
      );
    }

    // 3. Retrouver le paiement en base
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.merchantTransactionId, merchantTransactionId))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement introuvable" },
        { status: 404 }
      );
    }

    // 4. Sécurité : vérifier que le paiement appartient bien à l'user
    if (payment.userId !== userId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // 5. Si déjà traité (success/failed), retourner directement
    if (payment.status === "success" || payment.status === "failed") {
      return NextResponse.json({
        status: payment.status,
        message: payment.statusMessage,
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
        amount: payment.amount,
        currency: payment.currency,
        completedAt: payment.completedAt,
      });
    }

    // 6. Sinon, vérifier auprès de CinetPay (source de vérité)
    let verifyResponse;
    try {
      verifyResponse = await verifyCinetPayPayment(merchantTransactionId);
    } catch (verifyError: any) {
      console.error("❌ Erreur vérification CinetPay:", verifyError);
      return NextResponse.json(
        {
          status: "pending",
          message: "Vérification en cours, veuillez patienter...",
        },
        { status: 200 }
      );
    }

    const paymentData = verifyResponse.data;
    const realStatus = paymentData?.status || "UNKNOWN";

    console.log(`🔍 Verify - Statut CinetPay pour ${merchantTransactionId}: ${realStatus}`);

    // 7. Traiter selon le statut réel
    if (realStatus === "SUCCESS") {
      // ✅ Activer le Premium (si pas déjà fait par le webhook)
      await activatePremiumIfNeeded(payment.id);

      return NextResponse.json({
        status: "success",
        message: "Paiement réussi ! Premium activé.",
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
        amount: payment.amount,
        currency: payment.currency,
      });
    } else if (realStatus === "FAILED" || realStatus === "CANCELLED") {
      // ❌ Marquer comme échoué
      await db
        .update(payments)
        .set({
          status: "failed",
          statusMessage: verifyResponse.message || "Paiement échoué",
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return NextResponse.json({
        status: "failed",
        message: verifyResponse.message || "Le paiement a échoué",
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
      });
    } else {
      // ⏳ Toujours en attente
      return NextResponse.json({
        status: "pending",
        message: "Paiement en cours de traitement, veuillez patienter...",
        realStatus,
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur GET /api/payment/verify:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// ============================================
// 💎 ACTIVER LE PREMIUM (si pas déjà fait)
// Version simplifiée du webhook, pour double-sécurité
// ============================================
async function activatePremiumIfNeeded(paymentId: number) {
  try {
    // Récupérer le paiement (peut avoir été mis à jour par le webhook entretemps)
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) return;

    // Si déjà activé, ne rien faire
    if (payment.status === "success") {
      return;
    }

    // Récupérer l'utilisateur
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) return;

    // Calculer la date d'expiration (avec prolongation si déjà Premium)
    let expiresAt: Date;
    const now = new Date();

    if (
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) > now
    ) {
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

    // Mettre à jour le user
    await db
      .update(users)
      .set({
        isPremium: true,
        premiumExpiresAt: expiresAt,
        premiumPlan: payment.plan,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payment.userId));

    // Mettre à jour le paiement
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

    console.log(`🎉 Premium activé via verify pour user ${payment.userId}`);
  } catch (error) {
    console.error("❌ Erreur activatePremiumIfNeeded:", error);
  }
}
