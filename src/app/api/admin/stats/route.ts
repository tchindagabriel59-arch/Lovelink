import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages, reports } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq, gte, sql } from "drizzle-orm";

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
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      [totalUsers],
      [newToday],
      [newThisWeek],
      [newThisMonth],
      [activeUsers],
      [premiumUsers],
      [bannedUsers],
      [verifiedUsers], // ✅ NOUVEAU
      genderStats,
      [totalLikes],
      [totalMatches],
      [totalMessages],
      [pendingReports],
      [totalReports],
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
        .where(gte(users.createdAt, monthAgo)),
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
      // ✅ Compte exact des badges vérifiés
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
    ]);

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
          verified: verifiedUsers.count, // ✅ NOUVEAU
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
          monthlyRevenue: premiumUsers.count * 5,
          yearlyRevenue: premiumUsers.count * 5 * 12,
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
