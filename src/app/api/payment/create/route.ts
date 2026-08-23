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

    // 1. Normalisation intelligente du PLAN (premium, gold, boost)
    let plan: PremiumPlan = "premium";
    const rawPlan = String(body.plan || body.planType || body.type || "premium").toLowerCase();
    if (rawPlan.includes("gold")) {
      plan = "gold";
    } else if (rawPlan.includes("boost")) {
      plan = "boost";
    } else {
      plan = "premium";
    }

    // 2. Normalisation intelligente de la DURÉE / PERIODE
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
      period = "monthly"; // Par défaut 1 mois
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

    /*
     * Si aucun pays n'a encore été sélectionné :
     * Redirection vers la page de choix du pays.
     */
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

    const merchantTransactionId = generateMerchantTransactionId(userId);

    let paymentUrl = "";
    let paymentToken = "";

    if (country === "CM") {
      /*
       * 🇨🇲 CAMEROUN : Paiement direct MTN / Orange Manuel
       */
      const manualUrl = new URL("/premium/manual-cm", baseUrl);

      manualUrl.searchParams.set("plan", plan);
      manualUrl.searchParams.set("period", period);
      manualUrl.searchParams.set("amount", String(amount));
      manualUrl.searchParams.set("userId", String(userId));
      manualUrl.searchParams.set("tx", merchantTransactionId);

      paymentUrl = manualUrl.toString();
      paymentToken = `MANUAL-${merchantTransactionId}`.substring(0, 30);
    } else {
      /*
       * 🌍 AUTRES PAYS : PayDunya (Wave, OM, Carte)
       */
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
