import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, subscriptions, payments } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const [adminCheck] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!adminCheck?.isAdmin) {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    // Récupérer tous les Premium
    const premiumUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        gender: users.gender,
        city: users.city,
        country: users.country,
        isPremium: users.isPremium,
        premiumPlan: users.premiumPlan,
        premiumExpiresAt: users.premiumExpiresAt,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isPremium, true))
      .orderBy(desc(users.premiumExpiresAt));

    // Récupérer le dernier paiement de chaque utilisateur
    const usersWithPayments = await Promise.all(
      premiumUsers.map(async (user) => {
        const [lastPayment] = await db
          .select({
            amount: payments.amount,
            currency: payments.currency,
            plan: payments.plan,
            billingPeriod: payments.billingPeriod,
            paymentMethod: payments.paymentMethod,
            completedAt: payments.completedAt,
            status: payments.status,
          })
          .from(payments)
          .where(and(eq(payments.userId, user.id), eq(payments.status, "success")))
          .orderBy(desc(payments.completedAt))
          .limit(1);

        return {
          ...user,
          lastPayment: lastPayment || null,
        };
      })
    );

    // Calculer les stats globales
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Revenus des 30 derniers jours
    const recentPayments = await db
      .select({
        amount: payments.amount,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "success"),
          gte(payments.completedAt, monthAgo)
        )
      );

    const monthlyRevenue = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Total tous temps
    const allSuccessPayments = await db
      .select({
        amount: payments.amount,
      })
      .from(payments)
      .where(eq(payments.status, "success"));

    const totalRevenue = allSuccessPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculer les expirations à venir (7 prochains jours)
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringSoon = usersWithPayments.filter((u) => {
      if (!u.premiumExpiresAt) return false;
      const expiry = new Date(u.premiumExpiresAt);
      return expiry > now && expiry <= in7Days;
    }).length;

    return NextResponse.json({
      premiumUsers: usersWithPayments,
      stats: {
        total: usersWithPayments.length,
        monthly: usersWithPayments.filter((u) => u.premiumPlan === "premium").length,
        gold: usersWithPayments.filter((u) => u.premiumPlan === "gold").length,
        monthlyRevenue,
        totalRevenue,
        expiringSoon,
      },
    });
  } catch (error) {
    console.error("Get premium users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
