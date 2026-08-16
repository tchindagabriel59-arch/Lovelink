import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer toutes les villes uniques (normalisées)
    const result = await db.execute(sql`
      SELECT 
        UPPER(TRIM(city)) as city,
        COUNT(*)::int as count
      FROM users
      WHERE city IS NOT NULL AND TRIM(city) != ''
      GROUP BY UPPER(TRIM(city))
      ORDER BY count DESC
    `);

    const cities = (result.rows as { city: string; count: number }[]).map(
      (c) => ({
        // Format joli : première lettre majuscule
        name: c.city.charAt(0).toUpperCase() + c.city.slice(1).toLowerCase(),
        count: Number(c.count),
      })
    );

    return NextResponse.json(
      { cities },
      {
        headers: {
          "Cache-Control": "private, max-age=300", // 5 min
        },
      }
    );
  } catch (error) {
    console.error("Cities error:", error);
    return NextResponse.json({ cities: [] }, { status: 500 });
  }
}
