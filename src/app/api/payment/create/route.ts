import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import {
  createCinetPayPayment,
  generateMerchantTransactionId,
  getPaymentUrls,
  getPremiumPrice,
  getPaymentDesignation,
  type PremiumPlan,
  type BillingPeriod,
} from "@/lib/cinetpay";

// ============================================
// POST /api/payment/create
// Crée un paiement CinetPay pour un plan Premium
// ============================================
export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier que l'user est connecté
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // 2. Récupérer les paramètres
    const body = await req.json();
    const {
      plan,          // 'premium' | 'gold'
      billingPeriod, // 'monthly' | 'yearly'
      phone,         // numéro Mobile Money (optionnel mais recommandé)
    } = body;

    // 3. Validation
    if (!plan || !["premium", "gold"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalide (premium ou gold)" },
        { status: 400 }
      );
    }

    if (!billingPeriod || !["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "Période invalide (monthly ou yearly)" },
        { status: 400 }
      );
    }

    // 4. Récupérer les infos de l'user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // 5. Vérifier que l'user n'a pas déjà un Premium actif
    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) > new Date()
    ) {
      return NextResponse.json(
        {
          error: "Vous avez déjà un abonnement Premium actif",
          code: "ALREADY_PREMIUM",
          expiresAt: user.premiumExpiresAt,
        },
        { status: 400 }
      );
    }

    // 6. Calculer le montant
    const amount = getPremiumPrice(plan as PremiumPlan, billingPeriod as BillingPeriod);
    const designation = getPaymentDesignation(plan as PremiumPlan, billingPeriod as BillingPeriod);

    // 7. Générer un ID unique de transaction
    const merchantTransactionId = generateMerchantTransactionId(userId);
    const urls = getPaymentUrls(merchantTransactionId);

    // 8. Créer le paiement chez CinetPay
    const cinetpayResponse = await createCinetPayPayment({
      amount,
      currency: "XOF",
      merchant_transaction_id: merchantTransactionId,
      lang: "fr",
      designation,
      client_email: user.email,
      client_first_name: user.firstName,
      client_last_name: user.lastName,
      client_phone_number: phone || undefined,
      success_url: urls.success_url,
      failed_url: urls.failed_url,
      notify_url: urls.notify_url,
      direct_pay: false, // false = redirection vers page CinetPay
    });

    // 9. Enregistrer le paiement en base (statut: pending)
    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      cinetpayTransactionId: cinetpayResponse.transaction_id,
      notifyToken: cinetpayResponse.notify_token,
      paymentToken: cinetpayResponse.payment_token,
      paymentUrl: cinetpayResponse.payment_url,
      amount,
      currency: "XOF",
      plan,
      billingPeriod,
      status: "pending",
      statusMessage: cinetpayResponse.details.message,
      clientEmail: user.email,
      clientFirstName: user.firstName,
      clientLastName: user.lastName,
      clientPhone: phone || null,
    });

    // 10. Retourner l'URL de paiement au client
    return NextResponse.json({
      success: true,
      paymentUrl: cinetpayResponse.payment_url,
      merchantTransactionId,
      amount,
      currency: "XOF",
      plan,
      billingPeriod,
      designation,
    });
  } catch (error: any) {
    console.error("❌ Erreur POST /api/payment/create:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la création du paiement",
      },
      { status: 500 }
    );
  }
}
