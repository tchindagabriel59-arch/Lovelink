import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// 1️⃣ GET : Récupérer tous les paiements en attente
export async function GET() {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!(admin as any)?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const pendingPayments = await db
      .select({
        payment: payments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
          email: users.email,
        },
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.status, "pending"))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({ pending: pendingPayments });
  } catch (error) {
    console.error("Erreur GET pending payments:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// 2️⃣ POST : Valider un paiement (Activer Boost ou Premium)
export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!(admin as any)?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { paymentId } = await req.json();
    if (!paymentId) return NextResponse.json({ error: "ID de paiement manquant" }, { status: 400 });

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const u = user as any;

    // Mettre à jour le statut du paiement
    await db.update(payments)
      .set({ status: "completed", updatedAt: new Date() } as any)
      .where(eq(payments.id, paymentId));

    const now = new Date();

    // Activer le service
    if (payment.plan === "boost") {
      let hoursToAdd = 24;
      if (payment.billingPeriod === "3d") hoursToAdd = 72;
      if (payment.billingPeriod === "7d") hoursToAdd = 168;

      const currentExpiry = u.boostExpiresAt ? new Date(u.boostExpiresAt) : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);

      await db.update(users).set({ isBoosted: true, boostExpiresAt: newExpiry } as any).where(eq(users.id, u.id));
    } else {
      // Premium ou Gold
      let monthsToAdd = 1;
      if (payment.billingPeriod === "yearly") monthsToAdd = 12;

      const currentExpiry = u.premiumExpiresAt ? new Date(u.premiumExpiresAt) : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.setMonth(baseDate.getMonth() + monthsToAdd));

      await db.update(users).set({ isPremium: true, premiumPlan: payment.plan, premiumExpiresAt: newExpiry } as any).where(eq(users.id, u.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST validate payment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
