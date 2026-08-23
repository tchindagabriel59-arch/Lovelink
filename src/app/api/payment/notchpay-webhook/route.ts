import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyNotchPaySignature } from "@/lib/notchpay";
import { getSubscriptionExpiryDate, BillingPeriod } from "@/lib/paydunya";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-notch-signature") || "";

    // 🔒 1. Vérification de sécurité avec la Clé de hachage
    if (signature && !verifyNotchPaySignature(rawBody, signature)) {
      console.error("❌ Signature Webhook NotchPay invalide !");
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    // Seul l’événement "payment.complete" nous intéresse
    if (event !== "payment.complete") {
      return NextResponse.json({ message: "Événement ignoré" }, { status: 200 });
    }

    const reference = data.reference;
    const merchantTxId = data.merchant_reference || reference;

    // 2. Recherche du paiement en base de données
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.merchantTransactionId, merchantTxId))
      .limit(1);

    if (!payment) {
      console.error("❌ Paiement non trouvé pour la référence :", merchantTxId);
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ message: "Déjà traité" }, { status: 200 });
    }

    // 3. Mettre à jour le statut du paiement à "completed"
    await db
      .update(payments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    // 4. Activer le Boost ou l'Abonnement pour l'utilisateur
    const userId = payment.userId;
    const plan = payment.plan;
    const period = payment.billingPeriod as BillingPeriod;
    const expiresAt = getSubscriptionExpiryDate(period);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user) {
      if (plan === "boost") {
        // 🔥 Activation du Boost
        const currentBoostExpiry = user.boostExpiresAt ? new Date(user.boostExpiresAt) : new Date();
        const baseDate = currentBoostExpiry > new Date() ? currentBoostExpiry : new Date();
        
        // Calcul cumulatif du boost
        let hoursToAdd = 24;
        if (period === "3d") hoursToAdd = 72;
        if (period === "7d") hoursToAdd = 168;

        const newBoostExpiry = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);

        await db
          .update(users)
          .set({
            isBoosted: true,
            boostExpiresAt: newBoostExpiry,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
          
        console.log(`🚀 Boost activé pour utilisateur ${userId} jusqu'au ${newBoostExpiry}`);
      } else {
        // 💎 Activation Premium / Gold
        await db
          .update(users)
          .set({
            isPremium: true,
            premiumPlan: plan,
            premiumExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log(`💎 Plan ${plan} activé pour utilisateur ${userId} jusqu'au ${expiresAt}`);
      }
    }

    return NextResponse.json({ success: true, message: "Paiement NotchPay validé avec succès" });
  } catch (error) {
    console.error("❌ Erreur Webhook NotchPay:", error);
    return NextResponse.json({ error: "Erreur interne webhook" }, { status: 500 });
  }
}
