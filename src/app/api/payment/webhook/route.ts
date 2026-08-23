import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPayDunyaInvoice } from "@/lib/paydunya";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const token = payload?.data?.hash || payload?.invoice?.token || req.nextUrl.searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

    const verification = await verifyPayDunyaInvoice(token);
    
    if (!verification?.invoice?.token) {
      return NextResponse.json({ error: "Facture non vérifiée" }, { status: 400 });
    }

    const [payment] = await db.select().from(payments).where(eq(payments.paymentToken, verification.invoice.token)).limit(1);
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    if (payment.status === "completed") return NextResponse.json({ success: true, message: "Déjà traité" });

    if (verification.status === "completed") {
      const now = new Date();
      
      if (payment.plan === "boost") {
        let addHours = 24;
        if (payment.billingPeriod === "3d") addHours = 72;
        if (payment.billingPeriod === "7d") addHours = 168;

        const [user] = await db.select({ boostEndAt: users.boostEndAt }).from(users).where(eq(users.id, payment.userId)).limit(1);
        
        let newBoostEndAt = new Date();
        if (user?.boostEndAt && new Date(user.boostEndAt) > now) {
          newBoostEndAt = new Date(user.boostEndAt);
        }
        
        newBoostEndAt.setHours(newBoostEndAt.getHours() + addHours);

        await db.update(users)
          .set({ boostEndAt: newBoostEndAt, lastBoostAt: now })
          .where(eq(users.id, payment.userId));
      } else {
        let expiryDate = new Date();
        if (payment.billingPeriod === "monthly") expiryDate.setMonth(expiryDate.getMonth() + 1);
        else expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await db.update(users)
          .set({ isPremium: true, premiumPlan: payment.plan, premiumExpiresAt: expiryDate })
          .where(eq(users.id, payment.userId));
      }

      await db.update(payments)
        .set({ status: "completed", completedAt: now, verifiedAt: now })
        .where(eq(payments.id, payment.id));
    } else {
      await db.update(payments)
        .set({ status: verification.status === "cancelled" ? "cancelled" : "failed" })
        .where(eq(payments.id, payment.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
