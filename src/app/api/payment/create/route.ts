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
      gateway?: "notchpay" | "paydunya" | "manual_cm" | "auto";
      returnPath?: string;
    };

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

    // 1. Récupération de l'utilisateur
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const u = user as any;

    // 2. Détection du Pays : Par défaut, c'est le CAMEROUN 🇨🇲
    const userCountry = (u.country || "").toUpperCase();
    const uemoaCountries = ["SN", "CI", "BJ", "BF", "ML", "TG"]; // Pays PayDunya
    
    // Si l'utilisateur est explicitement dans un pays UEMOA (ex: Sénégal, CI), on utilise PayDunya.
    // Sinon (Cameroun, ou pays non défini) -> On utilise la passerelle Cameroun !
    const isUemoa = uemoaCountries.includes(userCountry);
    const useNotchPayOrManual = !isUemoa || gateway === "notchpay" || gateway === "manual_cm";

    const merchantTransactionId = generateMerchantTransactionId(userId);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

    let paymentUrl = "";
    let paymentToken = "";
    let currency = "XAF";
    let paymentMethod = "manual_cm";

    if (useNotchPayOrManual) {
      // 🇨🇲 CAMEROUN : Mode Manuel MTN / Orange
      paymentUrl = `${baseUrl}/premium/manual-cm?plan=${plan}&period=${period}&amount=${amount}&userId=${userId}`;
      paymentToken = `MANUAL-${merchantTransactionId}`.substring(0, 30);
      currency = "XAF";
      paymentMethod = "manual_cm";
    } else {
      // 🌍 PAYS UEMOA (Sénégal, Côte d'Ivoire, etc.) : PayDunya
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
      currency = "XOF";
      paymentMethod = "paydunya";
    }

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée est invalide");
    }

    // 3. Sauvegarde BDD Sécurisée (Tous les champs sont fournis pour éviter l'erreur SQL)
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
