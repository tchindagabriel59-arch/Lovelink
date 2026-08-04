import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { isCurrentUserAdmin, getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId, role, value, premiumPlan, premiumDuration } = await req.json();

    if (!userId || !role || value === undefined) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Sécurité : Empêcher de se retirer ses propres droits admin
    const currentAdminId = await getCurrentUserId();
    if (userId === currentAdminId && role === "isAdmin" && value === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer vos propres droits admin" },
        { status: 400 }
      );
    }

    const validRoles = ["isAdmin", "isPremium", "isBanned"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // ✅ CAS SPÉCIAL : Attribution Premium avec plan + durée
    if (role === "isPremium" && value === true) {
      // Validation
      const validPlans = ["premium", "gold"];
      const validDurations = ["1month", "3months", "6months", "1year", "lifetime"];

      if (!premiumPlan || !validPlans.includes(premiumPlan)) {
        return NextResponse.json(
          { error: "Formule invalide (premium ou gold)" },
          { status: 400 }
        );
      }

      if (!premiumDuration || !validDurations.includes(premiumDuration)) {
        return NextResponse.json(
          { error: "Durée invalide" },
          { status: 400 }
        );
      }

      // Calcul date d'expiration
      let expiresAt: Date;
      const now = new Date();

      switch (premiumDuration) {
        case "1month":
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case "3months":
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          break;
        case "6months":
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 6);
          break;
        case "1year":
          expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          break;
        case "lifetime":
          // À vie = 100 ans
          expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 100);
          break;
        default:
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Prix selon plan
      const prices: Record<string, Record<string, number>> = {
        premium: { "1month": 2500, "3months": 7000, "6months": 13000, "1year": 21000, "lifetime": 0 },
        gold: { "1month": 5000, "3months": 14000, "6months": 26000, "1year": 42000, "lifetime": 0 },
      };
      const amount = prices[premiumPlan]?.[premiumDuration] || 0;

      // Mettre à jour l'utilisateur
      await db
        .update(users)
        .set({
          isPremium: true,
          premiumPlan,
          premiumExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Créer une entrée subscription pour tracking
      await db.insert(subscriptions).values({
        userId,
        plan: premiumPlan,
        billingPeriod: premiumDuration === "1year" || premiumDuration === "lifetime" ? "yearly" : "monthly",
        amount,
        currency: "XOF",
        status: "active",
        startsAt: now,
        expiresAt,
        autoRenew: false,
      });

      return NextResponse.json({
        success: true,
        message: `Premium ${premiumPlan} activé jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}`,
      });
    }

    // ✅ CAS : Retirer le Premium
    if (role === "isPremium" && value === false) {
      await db
        .update(users)
        .set({
          isPremium: false,
          premiumPlan: null,
          premiumExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({ success: true, message: "Premium retiré" });
    }

    // ✅ CAS : Autres rôles (Admin, Banni)
    const updateData: Record<string, boolean | Date> = {};
    updateData[role] = value;
    updateData.updatedAt = new Date();

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
