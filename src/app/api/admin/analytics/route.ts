import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sql, gte, and, eq } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // ⚡ Toutes les requêtes EN PARALLÈLE
    const [
  inscriptions30d,
  genderStats,
  topCities,
  revenueToday,
  revenueWeek,
  revenueMonth,
  revenueYear,
  revenueTotal,
  activityByHour,
  sourcesData,
] = await Promise.all([
  // 📈 Inscriptions 30 derniers jours
  db.execute(sql`
    SELECT 
      DATE(created_at) as date,
      gender,
      COUNT(*)::int as count
    FROM users
    WHERE created_at >= ${thirtyDaysAgo.toISOString()}
    GROUP BY DATE(created_at), gender
    ORDER BY date ASC
  `),

  // 📊 Ratio H/F
  db
    .select({
      gender: users.gender,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .groupBy(users.gender),

  // 🌍 Top 10 villes (normalisées)
  db.execute(sql`
    SELECT 
      UPPER(TRIM(city)) as city,
      COUNT(*)::int as count
    FROM users
    WHERE city IS NOT NULL AND TRIM(city) != ''
    GROUP BY UPPER(TRIM(city))
    ORDER BY count DESC
    LIMIT 10
  `),

  // 💰 Revenus aujourd'hui
  db
    .select({
      total: sql<number>`COALESCE(SUM(amount)::int, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.completedAt, today)
      )
    ),

  // 💰 Revenus 7 derniers jours
  db
    .select({
      total: sql<number>`COALESCE(SUM(amount)::int, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.completedAt, weekAgo)
      )
    ),

  // 💰 Revenus 30 derniers jours
  db
    .select({
      total: sql<number>`COALESCE(SUM(amount)::int, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.completedAt, monthAgo)
      )
    ),

  // 💰 Revenus 1 an
  db
    .select({
      total: sql<number>`COALESCE(SUM(amount)::int, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.completedAt, yearAgo)
      )
    ),

  // 💰 Revenus totaux
  db
    .select({
      total: sql<number>`COALESCE(SUM(amount)::int, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(eq(payments.status, "completed")),

  // ⏰ Activité par heure (basé sur last_seen des 7 derniers jours)
  db.execute(sql`
    SELECT 
      EXTRACT(HOUR FROM last_seen)::int as hour,
      COUNT(*)::int as count
    FROM users
    WHERE last_seen >= ${weekAgo.toISOString()}
    GROUP BY EXTRACT(HOUR FROM last_seen)
    ORDER BY hour ASC
  `),

  // 📱 Sources d'inscription (basé sur referred_by)
  db.execute(sql`
    SELECT 
      CASE 
        WHEN referred_by IS NOT NULL THEN 'parrainage'
        ELSE 'direct'
      END as source,
      COUNT(*)::int as count
    FROM users
    GROUP BY source
  `),
]);

    // Traiter les inscriptions par jour
    const inscriptionsRaw = inscriptions30d.rows as {
      date: string;
      gender: string;
      count: number;
    }[];

    // Créer un objet avec toutes les dates des 30 derniers jours (même sans inscription)
    const inscriptionsMap = new Map<
      string,
      { date: string; total: number; male: number; female: number; other: number }
    >();

    // Initialiser toutes les dates
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      inscriptionsMap.set(dateStr, {
        date: dateStr,
        total: 0,
        male: 0,
        female: 0,
        other: 0,
      });
    }

    // Remplir avec les vraies données
    for (const row of inscriptionsRaw) {
      const dateStr = new Date(row.date).toISOString().split("T")[0];
      const existing = inscriptionsMap.get(dateStr) || {
        date: dateStr,
        total: 0,
        male: 0,
        female: 0,
        other: 0,
      };

      existing.total += Number(row.count);
      if (row.gender === "male") existing.male += Number(row.count);
      else if (row.gender === "female") existing.female += Number(row.count);
      else existing.other += Number(row.count);

      inscriptionsMap.set(dateStr, existing);
    }

    // Convertir en tableau trié par date
    const inscriptionsPerDay = Array.from(inscriptionsMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        // Format lisible pour l'affichage
        label: new Date(d.date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
      }));

    // Traiter le ratio H/F
    const totalUsers = genderStats.reduce((sum, g) => sum + Number(g.count), 0);
    const genderData = genderStats.map((g) => ({
      name:
        g.gender === "male"
          ? "Hommes"
          : g.gender === "female"
          ? "Femmes"
          : g.gender === "non_binary"
          ? "Non-binaires"
          : "Autres",
      value: Number(g.count),
      percentage: totalUsers > 0 ? ((Number(g.count) / totalUsers) * 100).toFixed(1) : "0",
      color:
        g.gender === "male"
          ? "#3b82f6"
          : g.gender === "female"
          ? "#ec4899"
          : g.gender === "non_binary"
          ? "#a855f7"
          : "#f59e0b",
    }));

    // Traiter les villes (formater joliment : première lettre majuscule)
const citiesData = (topCities.rows as { city: string; count: number }[]).map(
  (c) => ({
    city: c.city.charAt(0).toUpperCase() + c.city.slice(1).toLowerCase(),
    count: Number(c.count),
  })
);
    // Traiter les heures d'activité (24h)
const activityMap = new Map<number, number>();
for (let i = 0; i < 24; i++) {
  activityMap.set(i, 0);
}
for (const row of activityByHour.rows as { hour: number; count: number }[]) {
  activityMap.set(Number(row.hour), Number(row.count));
}
const activityData = Array.from(activityMap.entries())
  .map(([hour, count]) => ({
    hour: `${hour}h`,
    count,
    // Icône selon l'heure
    period:
      hour >= 6 && hour < 12
        ? "🌅"
        : hour >= 12 && hour < 18
        ? "☀️"
        : hour >= 18 && hour < 22
        ? "🌆"
        : "🌙",
  }))
  .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

// Traiter les sources d'inscription
const sourcesRaw = sourcesData.rows as { source: string; count: number }[];
const totalSources = sourcesRaw.reduce((sum, s) => sum + Number(s.count), 0);
const sources = sourcesRaw.map((s) => ({
  name: s.source === "parrainage" ? "🎁 Parrainage" : "🌐 Direct / Meta",
  value: Number(s.count),
  percentage:
    totalSources > 0
      ? ((Number(s.count) / totalSources) * 100).toFixed(1)
      : "0",
  color: s.source === "parrainage" ? "#10b981" : "#3b82f6",
}));

    return NextResponse.json(
  {
    inscriptions: inscriptionsPerDay,
    gender: genderData,
    cities: citiesData,
    activity: activityData,
    sources: sources,
    revenue: {
      today: {
            amount: Number(revenueToday[0]?.total || 0),
            count: Number(revenueToday[0]?.count || 0),
          },
          week: {
            amount: Number(revenueWeek[0]?.total || 0),
            count: Number(revenueWeek[0]?.count || 0),
          },
          month: {
            amount: Number(revenueMonth[0]?.total || 0),
            count: Number(revenueMonth[0]?.count || 0),
          },
          year: {
            amount: Number(revenueYear[0]?.total || 0),
            count: Number(revenueYear[0]?.count || 0),
          },
          total: {
            amount: Number(revenueTotal[0]?.total || 0),
            count: Number(revenueTotal[0]?.count || 0),
          },
        },
        totalUsers,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
