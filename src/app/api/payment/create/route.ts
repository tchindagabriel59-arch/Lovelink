import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {
  createPayDunyaInvoice,
  generateMerchantTransactionId,
  getPaymentUrls,
  getPremiumPrice,
  getPaymentDesignation,
  PremiumPlan,
  BillingPeriod,
} from "@/lib/paydunya";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { plan, period, country = "CM", returnPath = "/discover" } = body as {
      plan: PremiumPlan;
      period: BillingPeriod;
      country?: "CM" | "OTHER";
      returnPath?: string;
    };

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

    // 1. Récupération de l'utilisateur
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const u = user as any;
    const merchantTransactionId = generateMerchantTransactionId(userId);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

    let paymentUrl = "";
    let paymentToken = "";
    const isCameroon = country === "CM";
    const currency = isCameroon ? "XAF" : "XOF";
    const paymentMethod = isCameroon ? "manual_cm" : "paydunya";

    if (isCameroon) {
      // 🇨🇲 CAMEROUN : Redirection Paiement Manuel MTN / Orange
      paymentUrl = `${baseUrl}/premium/manual-cm?plan=${plan}&period=${period}&amount=${amount}&userId=${userId}`;
      paymentToken = `MANUAL-${merchantTransactionId}`.substring(0, 30);
    } else {
      // 🌍 AUTRES PAYS : PayDunya (Zone UEMOA - Sénégal, CI, Bénin, Wave, etc.)
      const urls = getPaymentUrls(merchantTransactionId);
      urls.return_url = `${baseUrl}${returnPath}?tx=${merchantTransactionId}&status=success`;
      urls.cancel_url = `${baseUrl}${returnPath}?tx=${merchantTransactionId}&status=failed`;

      const invoiceData = await createPayDunyaInvoice({
        invoice: { total_amount: amount, description: description },
        store: { name: "LoveLink", website_url: baseUrl },
        actions: urls,
        custom_data: { userId: userId.toString(), plan, period },
      });

      paymentUrl = invoiceData.invoice_url || invoiceData.response_text;
      paymentToken = invoiceData.token || merchantTransactionId;
    }

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée est invalide");
    }

    // 2. Sauvegarde BDD Sécurisée
    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      paymentToken: paymentToken || merchantTransactionId,
      paymentUrl: paymentUrl,
      amount: Number(amount),
      currency: currency,
      plan: plan || "premium",
      billingPeriod: period || "monthly",
      paymentMethod: paymentMethod,
      status: "pending",
      statusMessage: "Paiement en attente de validation",
      clientEmail: u.email || `user_${userId}@lovelink.com`,
      clientFirstName: u.firstName || "Utilisateur",
      clientLastName: u.lastName || "",
      clientPhone: u.phone || u.phoneNumber || "",
    } as any);

    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl,
      gatewayUsed: paymentMethod,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
