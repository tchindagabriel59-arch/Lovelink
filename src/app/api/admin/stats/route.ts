import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages, reports, payments } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq, gte, sql, or, and } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      [totalUsers],
      [newToday],
      [newThisWeek],
      [newThisMonth],
      [activeUsers],
      [premiumUsers],
      [bannedUsers],
      [verifiedUsers],
      genderStats,
      [totalLikes],
      [totalMatches],
      [totalMessages],
      [pendingReports],
      [totalReports],
      // 💰 VRAIS REVENUS depuis payments
      [revenueTotal],
      [revenueMonth],
      [paidCount],
      [pendingPayments],
      [boostPaid],
      [premiumPaid],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.createdAt, today)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.createdAt, weekAgo)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.createdAt, monthStart)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.lastSeen, last24h)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isPremium, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isBanned, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isVerified, true)),
      db
        .select({
          gender: users.gender,
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .groupBy(users.gender),
      db.select({ count: sql<number>`count(*)::int` }).from(likes),
      db.select({ count: sql<number>`count(*)::int` }).from(matches),
      db.select({ count: sql<number>`count(*)::int` }).from(messages),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reports)
        .where(eq(reports.status, "pending")),
      db.select({ count: sql<number>`count(*)::int` }).from(reports),

      // Total encaissé (tous temps) — status success OU completed
      db
        .select({
          total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
        })
        .from(payments)
        .where(
          or(
            eq(payments.status, "success"),
            eq(payments.status, "completed")
          )
        ),

      // Encaissé ce mois-ci
      db
        .select({
          total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
        })
        .from(payments)
        .where(
          and(
            or(
              eq(payments.status, "success"),
              eq(payments.status, "completed")
            ),
            gte(payments.createdAt, monthStart)
          )
        ),

      // Nombre de paiements validés
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(
          or(
            eq(payments.status, "success"),
            eq(payments.status, "completed")
          )
        ),

      // Paiements en attente
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(eq(payments.status, "pending")),

      // Boosts payés validés
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(
          and(
            or(
              eq(payments.status, "success"),
              eq(payments.status, "completed")
            ),
            sql`lower(${payments.plan}) like '%boost%'`
          )
        ),

      // Premium/Gold payés validés
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(
          and(
            or(
              eq(payments.status, "success"),
              eq(payments.status, "completed")
            ),
            sql`lower(${payments.plan}) not like '%boost%'`
          )
        ),
    ]);

    const totalXof = Number(revenueTotal?.total || 0);
    const monthXof = Number(revenueMonth?.total || 0);

    return NextResponse.json(
      {
        users: {
          total: totalUsers.count,
          newToday: newToday.count,
          newThisWeek: newThisWeek.count,
          newThisMonth: newThisMonth.count,
          active24h: activeUsers.count,
          premium: premiumUsers.count,
          banned: bannedUsers.count,
          verified: verifiedUsers.count,
        },
        gender: genderStats,
        activity: {
          totalLikes: totalLikes.count,
          totalMatches: totalMatches.count,
          totalMessages: totalMessages.count,
        },
        reports: {
          pending: pendingReports.count,
          total: totalReports.count,
        },
        revenue: {
          // Vrais montants FCFA
          totalXof,
          monthXof,
          paidCount: paidCount.count,
          pendingCount: pendingPayments.count,
          boostPaidCount: boostPaid.count,
          premiumPaidCount: premiumPaid.count,
          // rétrocompat (évite crash si ancien front)
          monthlyRevenue: monthXof,
          yearlyRevenue: totalXof,
          currency: "XOF",
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
