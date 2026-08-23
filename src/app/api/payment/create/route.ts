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
    const { plan, period, returnPath = "/premium" } = body as {
      plan: PremiumPlan;
      period: BillingPeriod;
      returnPath?: string;
    };

    const amount = getPremiumPrice(plan, period);
    const description = getPaymentDesignation(plan, period);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const merchantTransactionId = generateMerchantTransactionId(userId);
    const urls = getPaymentUrls(merchantTransactionId);
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";
    urls.return_url = `${baseUrl}${returnPath}?tx=${merchantTransactionId}&status=success`;
    urls.cancel_url = `${baseUrl}${returnPath}?tx=${merchantTransactionId}&status=failed`;

    const invoiceData = await createPayDunyaInvoice({
      invoice: {
        total_amount: amount,
        description: description,
      },
      store: {
        name: "LoveLink",
        website_url: baseUrl,
      },
      actions: urls,
      custom_data: {
        userId: userId.toString(),
        plan,
        period,
      },
    });

    // ✅ FIX CORRECTION PAYDUNYA URL : Prend response_text si invoice_url est vide
    const paymentUrl = invoiceData.invoice_url || invoiceData.response_text;

    if (!paymentUrl || !paymentUrl.startsWith("http")) {
      throw new Error("L'URL de paiement générée par PayDunya est invalide");
    }

    await db.insert(payments).values({
      userId,
      merchantTransactionId,
      paymentToken: invoiceData.token || "",
      paymentUrl: paymentUrl,
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
    });
  } catch (error) {
    console.error("Payment create error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: errorMessage || "Erreur lors de la création du paiement",
    }, { status: 500 });
  }
}
