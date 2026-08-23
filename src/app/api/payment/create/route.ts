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
import { sendTelegramAlert, formatPaymentAlert } from "@/lib/telegram";

type PaymentCountry = "CM" | "OTHER";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 1. Normalisation du PLAN
    let plan: PremiumPlan = "premium";
    const rawPlan = String(body.plan || body.planType || body.type || "premium").toLowerCase();
    if (rawPlan.includes("gold")) {
      plan = "gold";
    } else if (rawPlan.includes("boost")) {
      plan = "boost";
    } else {
      plan = "premium";
    }

    // 2. Normalisation de la DURÉE
    let period: BillingPeriod = "monthly";
    const rawPeriod = String(body.period || body.duration || body.billingPeriod || body.periodLabel || "monthly").toLowerCase();

    if (rawPeriod.includes("an") || rawPeriod.includes("year") || rawPeriod === "1y" || rawPeriod === "yearly") {
      period = "yearly";
    } else if (rawPeriod.includes("24") || rawPeriod.includes("1j")) {
      period = "24h";
    } else if (rawPeriod.includes("3d") || rawPeriod.includes("3j") || rawPeriod.includes("3")) {
      period = "3d";
    } else if (rawPeriod.includes("7d") || rawPeriod.includes("7j") || rawPeriod.includes("7")) {
      period = "7d";
    } else {
      period = "monthly";
    }

    const country: PaymentCountry | undefined = body.country;
    const defaultReturnPath = plan === "boost" ? "/discover" : "/premium";

    const returnPath =
      typeof body.returnPath === "string" &&
      body.returnPath.startsWith("/") &&
      !body.returnPath.startsWith("//")
        ? body.returnPath
        : defaultReturnPath;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

    // Si le pays n'est pas encore choisi -> Redirection choix du pays
    if (country !== "CM" && country !== "OTHER") {
      const choiceUrl = new URL(
        "/premium/choose-payment-country",
        baseUrl
      );

      choiceUrl.searchParams.set("plan", plan);
      choiceUrl.searchParams.set("period", period);
      choiceUrl.searchParams.set("returnPath", returnPath);

      return NextResponse.json({
        success: true,
        requiresCountrySelection: true,
        paymentUrl: choiceUrl.toString(),
      });
    }

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

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

    const u = user as any;
    const merchantTransactionId = generateMerchantTransactionId(userId);

    let paymentUrl = "";
    let paymentToken = "";

    if (country === "CM") {
      // 🇨🇲 CAMEROUN : Paiement direct MTN / Orange Manuel
      const manualUrl = new URL("/premium/manual-cm", baseUrl);

      manualUrl.searchParams.set("plan", plan);
      manualUrl.searchParams.set("period", period);
      manualUrl.searchParams.set("amount", String(amount));
      manualUrl.searchParams.set("userId", String(userId));
      manualUrl.searchParams.set("tx", merchantTransactionId);

      paymentUrl = manualUrl.toString();
      paymentToken = `MANUAL-${merchantTransactionId}`.substring(0, 30);
    } else {
      // 🌍 AUTRES PAYS : PayDunya
      const urls = getPaymentUrls(merchantTransactionId);

      urls.return_url =
        `${baseUrl}${returnPath}` +
        `?tx=${encodeURIComponent(merchantTransactionId)}` +
        `&status=success`;

      urls.cancel_url =
        `${baseUrl}${returnPath}` +
        `?tx=${encodeURIComponent(merchantTransactionId)}` +
        `&status=failed`;

      const invoiceData = await createPayDunyaInvoice({
        invoice: {
          total_amount: amount,
          description,
        },
        store: {
          name: "LoveLink",
          website_url: baseUrl,
        },
        actions: urls,
        custom_data: {
          userId: String(userId),
          plan,
          period,
        },
      });

      paymentUrl = invoiceData.invoice_url || invoiceData.response_text;
      paymentToken = invoiceData.token || merchantTransactionId;
    }

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée est invalide");
    }

    // Sauvegarde en BDD
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
    } as any);

    // 🤖 ENVOI ALERTE TELEGRAM EN ARRIÈRE-PLAN
    sendTelegramAlert(
      formatPaymentAlert({
        type: country === "CM" ? "manual_cm" : "intent",
        userId: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: plan,
        period: period,
        amount: amount,
        currency: country === "CM" ? "XAF" : "XOF",
        gateway: country === "CM" ? "MTN / Orange CM (Manuel)" : "PayDunya",
        tx: merchantTransactionId,
        phone: u.phone || u.phoneNumber || "",
      })
    ).catch((err) => console.error("Telegram alert background error:", err));

    return NextResponse.json({
      success: true,
      paymentUrl,
      gatewayUsed: country === "CM" ? "manual_cm" : "paydunya",
    });
  } catch (error) {
    console.error("Payment create error:", error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: errorMessage || "Erreur lors de la création du paiement",
      },
      { status: 500 }
    );
  }
}
