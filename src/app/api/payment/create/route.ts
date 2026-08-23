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
    const { plan, period, gateway = "auto", country = "CM", returnPath = "/discover" } = body as {
      plan: PremiumPlan;
      period: BillingPeriod;
      gateway?: "notchpay" | "paydunya" | "auto";
      country?: string;
      returnPath?: string;
    };

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const merchantTransactionId = generateMerchantTransactionId(userId);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

    // 🔀 DÉCISION DU GATEWAY : Si Cameroun (CM) ou forcé NotchPay -> Mode Manuel CM Temporaire
    const useNotchPay = gateway === "notchpay" || (gateway === "auto" && country === "CM");

    let paymentUrl = "";
    let paymentToken = "";

    if (useNotchPay) {
      // 🇨🇲 MODE MANUEL CAMEROUN TEMPORAIRE (Attente validation NotchPay Live)
      paymentUrl = `${baseUrl}/premium/manual-cm?plan=${plan}&period=${period}&amount=${amount}&userId=${userId}`;
      paymentToken = `MANUAL-${merchantTransactionId}`;
    } else {
      // 🌍 ROUTE PAYDUNYA (Zone UEMOA : Sénégal, CI, Bénin, etc.)
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
      paymentToken = invoiceData.token || "";
    }

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée est invalide");
    }

    // Sauvegarde de l'intention de paiement en BDD
    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      paymentToken,
      paymentUrl,
      amount,
      plan,
      billingPeriod: period,
      status: "pending",
      clientEmail: user.email,
      clientFirstName: user.firstName,
      clientLastName: user.lastName || "",
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl,
      gatewayUsed: useNotchPay ? "manual_cm" : "paydunya",
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
