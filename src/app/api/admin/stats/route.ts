import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages, reports } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq, gte, sql, and } from "drizzle-orm";

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

    // Compter les utilisateurs
    const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [newToday] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, today));
    const [newThisWeek] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, weekAgo));
    const [newThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, monthAgo));
    const [activeUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.lastSeen, last24h));
    const [premiumUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isPremium, true));
    const [bannedUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isBanned, true));

    // Genre
    const genderStats = await db
      .select({
        gender: users.gender,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.gender);

    // Autres stats
    const [totalLikes] = await db.select({ count: sql<number>`count(*)::int` }).from(likes);
    const [totalMatches] = await db.select({ count: sql<number>`count(*)::int` }).from(matches);
    const [totalMessages] = await db.select({ count: sql<number>`count(*)::int` }).from(messages);
    const [pendingReports] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "pending"));
    const [totalReports] = await db.select({ count: sql<number>`count(*)::int` }).from(reports);

    return NextResponse.json({
      users: {
        total: totalUsers.count,
        newToday: newToday.count,
        newThisWeek: newThisWeek.count,
        newThisMonth: newThisMonth.count,
        active24h: activeUsers.count,
        premium: premiumUsers.count,
        banned: bannedUsers.count,
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
        monthlyRevenue: premiumUsers.count * 5, // Suppose 5€/mois
        yearlyRevenue: premiumUsers.count * 5 * 12,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
