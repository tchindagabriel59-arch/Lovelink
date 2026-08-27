import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { sendPushToUser, PushTemplates } from "@/lib/push";

// 1️⃣ GET : Paiements en attente
export async function GET() {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!(admin as any)?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

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

// 3️⃣ DELETE : Supprimer un paiement annulé / ignoré
export async function DELETE(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!(admin as any)?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await db.delete(payments).where(eq(payments.id, parseInt(paymentId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE payment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// 2️⃣ POST : Valider un paiement + Push
export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!(admin as any)?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json(
        { error: "ID de paiement manquant" },
        { status: 400 }
      );
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement introuvable" },
        { status: 404 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const u = user as any;
    const now = new Date();

    const rawPlan = String(payment.plan || "").toLowerCase();
    const rawPeriod = String(payment.billingPeriod || "").toLowerCase();
    const isBoost = rawPlan.includes("boost");

    if (isBoost) {
      let hoursToAdd = 24;
      let durationLabel = "24 heures";

      if (
        rawPeriod.includes("3d") ||
        rawPeriod.includes("3j") ||
        rawPeriod === "3"
      ) {
        hoursToAdd = 72;
        durationLabel = "3 jours";
      } else if (
        rawPeriod.includes("7d") ||
        rawPeriod.includes("7j") ||
        rawPeriod === "7"
      ) {
        hoursToAdd = 168;
        durationLabel = "7 jours";
      }

      let baseDate = now;
      if (u.boostExpiresAt) {
        const parsed = new Date(u.boostExpiresAt);
        if (!isNaN(parsed.getTime()) && parsed > now) {
          baseDate = parsed;
        }
      }

      const newExpiry = new Date(
        baseDate.getTime() + hoursToAdd * 60 * 60 * 1000
      );

      await db
        .update(users)
        .set({
          isBoosted: true,
          boostExpiresAt: newExpiry,
          updatedAt: now,
        } as any)
        .where(eq(users.id, user.id));

      // 🔔 Push Boost activé
      sendPushToUser(payment.userId, {
        title: "🚀 Boost activé !",
        body: `Ton profil est mis en avant pendant ${durationLabel}. Profite-en !`,
        icon: "/icon",
        tag: "boost",
        url: "/discover",
      }).catch(() => {});
    } else {
      const planName = rawPlan.includes("gold") ? "gold" : "premium";
      let monthsToAdd = 1;
      let durationLabel = "1 mois";

      if (
        rawPeriod.includes("year") ||
        rawPeriod.includes("an") ||
        rawPeriod.includes("1y")
      ) {
        monthsToAdd = 12;
        durationLabel = "1 an";
      }

      let baseDate = now;
      if (u.premiumExpiresAt) {
        const parsed = new Date(u.premiumExpiresAt);
        if (!isNaN(parsed.getTime()) && parsed > now) {
          baseDate = parsed;
        }
      }

      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

      await db
        .update(users)
        .set({
          isPremium: true,
          premiumPlan: planName,
          premiumExpiresAt: newExpiry,
          updatedAt: now,
        } as any)
        .where(eq(users.id, user.id));

      // 🔔 Push Premium activé
      sendPushToUser(payment.userId, {
        title: "👑 Premium activé !",
        body: `Ton abonnement ${planName.toUpperCase()} est actif pour ${durationLabel}.`,
        icon: "/icon",
        tag: "premium",
        url: "/premium",
      }).catch(() => {});
    }

    await db
      .update(payments)
      .set({ status: "completed", updatedAt: now } as any)
      .where(eq(payments.id, paymentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST validate payment:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg || "Erreur serveur" },
      { status: 500 }
    );
  }
}
