import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import {
  createPayDunyaInvoice,
  generateMerchantTransactionId,
  getPaymentUrls,
  getPremiumPrice,
  getPaymentDesignation,
  type PremiumPlan,
  type BillingPeriod,
} from "@/lib/paydunya";

// ============================================
// POST /api/payment/create
// Crée un paiement PayDunya pour un plan Premium
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
      phone,         // numéro Mobile Money (optionnel)
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

    // 8. Créer la facture chez PayDunya
    const paydunyaResponse = await createPayDunyaInvoice({
      invoice: {
        total_amount: amount,
        description: designation,
        items: {
          item_0: {
            name: `LoveLink ${plan === "premium" ? "Premium" : "Gold"}`,
            quantity: 1,
            unit_price: String(amount),
            total_price: String(amount),
            description: `Abonnement ${billingPeriod === "monthly" ? "mensuel" : "annuel"} - ${plan === "premium" ? "Premium" : "Gold"}`,
          },
        },
      },
      store: {
        name: "LoveLink",
        tagline: "Trouvez l'amour, l'amitié et de belles connexions",
        website_url: "https://lovelink237.com",
        phone: "+221778161664",
      },
      custom_data: {
        merchant_transaction_id: merchantTransactionId,
        user_id: String(userId),
        plan: plan,
        billing_period: billingPeriod,
        user_email: user.email,
      },
      actions: {
        cancel_url: urls.cancel_url,
        return_url: urls.return_url,
        callback_url: urls.callback_url,
      },
    });

    // 9. Vérifier la réponse PayDunya
    if (!paydunyaResponse.token || !paydunyaResponse.invoice_url) {
      console.error("❌ Réponse PayDunya invalide:", paydunyaResponse);
      return NextResponse.json(
        {
          error: "Erreur lors de la création du paiement PayDunya",
          details: paydunyaResponse.response_text,
        },
        { status: 500 }
      );
    }

    // 10. Enregistrer le paiement en base (statut: pending)
    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      cinetpayTransactionId: paydunyaResponse.token, // On réutilise le champ pour stocker le token PayDunya
      paymentToken: paydunyaResponse.token,
      paymentUrl: paydunyaResponse.invoice_url,
      amount,
      currency: "XOF",
      plan,
      billingPeriod,
      status: "pending",
      statusMessage: paydunyaResponse.response_text || "Paiement initié",
      clientEmail: user.email,
      clientFirstName: user.firstName,
      clientLastName: user.lastName,
      clientPhone: phone || null,
    });

    // 11. Retourner l'URL de paiement au client
    return NextResponse.json({
      success: true,
      paymentUrl: paydunyaResponse.invoice_url,
      merchantTransactionId,
      token: paydunyaResponse.token,
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
