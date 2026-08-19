import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ eligible: false }, { status: 401 });
    }

    // Vérifier si l'user a reçu une notif "incomplete_profile" dans les 7 derniers jours
    // ET qu'elle n'a pas déjà été récompensée
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const relance = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "incomplete_profile"),
          gte(notifications.createdAt, sevenDaysAgo),
          sql`${notifications.content} NOT LIKE '%[REWARDED]%'`
        )
      )
      .limit(1);

    return NextResponse.json({
      eligible: relance.length > 0,
    });
  } catch (error) {
    console.error("[Reward Check] Erreur:", error);
    return NextResponse.json({ eligible: false }, { status: 500 });
  }
}
