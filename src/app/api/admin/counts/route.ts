import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, reports } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq, count, and } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // ⚡ Toutes les requêtes en PARALLÈLE
    const [
      [totalUsers],
      [totalPremium],
      [pendingVerifications],
      [pendingReports],
    ] = await Promise.all([
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(users).where(eq(users.isPremium, true)),
      db
        .select({ c: count() })
        .from(users)
        .where(eq(users.verificationStatus, "pending")),
      db
        .select({ c: count() })
        .from(reports)
        .where(eq(reports.status, "pending")),
    ]);

    return NextResponse.json(
      {
        users: totalUsers.c,
        premium: totalPremium.c,
        verifications: pendingVerifications.c,
        reports: pendingReports.c,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Admin counts error:", error);
    return NextResponse.json(
      { users: 0, premium: 0, verifications: 0, reports: 0 },
      { status: 500 }
    );
  }
}
