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
    const { plan, period, gateway = "auto", returnPath = "/discover" } = body as {
      plan: PremiumPlan;
      period: BillingPeriod;
      gateway?: "notchpay" | "paydunya" | "auto";
      returnPath?: string;
    };

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

    // 1. Récupération de l'utilisateur et de son pays
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    // 2. Détection intelligente du pays (Cameroun vs Reste du monde)
    const userCountry = (user.country || "").toUpperCase();
    const userPhone = user.phone || "";
    
    // Est au Cameroun si pays = "CM" ou "CAMEROUN" ou téléphone commence par +237 / 237
    const isCameroon =
      userCountry === "CM" ||
      userCountry.includes("CAMER") ||
      userPhone.startsWith("+237") ||
      userPhone.startsWith("237");

    const merchantTransactionId = generateMerchantTransactionId(userId);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

    let paymentUrl = "";
    let paymentToken = "";
    let currency = "XOF";
    let paymentMethod = "paydunya";

    if (gateway === "notchpay" || (gateway === "auto" && isCameroon)) {
      // 🇨🇲 CAMEROUN : Mode Manuel MTN / Orange
      paymentUrl = `${baseUrl}/premium/manual-cm?plan=${plan}&period=${period}&amount=${amount}&userId=${userId}`;
      paymentToken = `MANUAL-${merchantTransactionId}`.substring(0, 30);
      currency = "XAF";
      paymentMethod = "manual_cm";
    } else {
      // 🌍 AUTRES PAYS : PayDunya (Wave, Orange Money SN/CI, MTN CI, etc.)
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
      currency = "XOF";
      paymentMethod = "paydunya";
    }

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée est invalide");
    }

    // 3. Sauvegarde BDD Sécurisée avec TOUS les champs requis par le schéma Drizzle
    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      paymentToken,
      paymentUrl,
      amount,
      currency,
      plan,
      billingPeriod: period,
      paymentMethod,
      status: "pending",
      clientEmail: user.email || `user_${userId}@lovelink.com`,
      clientFirstName: user.firstName || "Utilisateur",
      clientLastName: user.lastName || "",
      clientPhone: user.phone || "",
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
