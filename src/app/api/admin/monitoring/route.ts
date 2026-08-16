import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiLogs } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sql, gte, desc, and, gt } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);

    // ⚡ Toutes les requêtes en PARALLÈLE
    const [
      recentErrors,
      slowestEndpoints,
      trafficByHour,
      statusCodesStats,
      totalRequestsResult,
      totalErrorsResult,
      avgDurationResult,
      topEndpoints,
    ] = await Promise.all([
      // 🚨 Dernières 50 erreurs (status >= 400)
      db
        .select({
          id: apiLogs.id,
          endpoint: apiLogs.endpoint,
          method: apiLogs.method,
          statusCode: apiLogs.statusCode,
          durationMs: apiLogs.durationMs,
          errorMessage: apiLogs.errorMessage,
          createdAt: apiLogs.createdAt,
        })
        .from(apiLogs)
        .where(and(gte(apiLogs.statusCode, 400), gte(apiLogs.createdAt, last24h)))
        .orderBy(desc(apiLogs.createdAt))
        .limit(50),

      // ⏱️ Top 10 endpoints les plus lents (dernières 24h)
      db.execute(sql`
        SELECT 
          endpoint,
          method,
          AVG(duration_ms)::int as avg_duration,
          MAX(duration_ms)::int as max_duration,
          COUNT(*)::int as call_count
        FROM api_logs
        WHERE created_at >= ${last24h.toISOString()}
        GROUP BY endpoint, method
        HAVING COUNT(*) >= 3
        ORDER BY avg_duration DESC
        LIMIT 10
      `),

      // 📊 Trafic par heure (dernières 24h)
      db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hour,
          COUNT(*)::int as count,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::int as errors
        FROM api_logs
        WHERE created_at >= ${last24h.toISOString()}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour ASC
      `),

      // 📈 Répartition status codes (24h)
      db.execute(sql`
        SELECT 
          CASE 
            WHEN status_code < 300 THEN '2xx'
            WHEN status_code < 400 THEN '3xx'
            WHEN status_code < 500 THEN '4xx'
            ELSE '5xx'
          END as category,
          COUNT(*)::int as count
        FROM api_logs
        WHERE created_at >= ${last24h.toISOString()}
        GROUP BY category
        ORDER BY category
      `),

      // 🔢 Total requêtes 24h
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiLogs)
        .where(gte(apiLogs.createdAt, last24h)),

      // ❌ Total erreurs 24h
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiLogs)
        .where(and(gte(apiLogs.statusCode, 400), gte(apiLogs.createdAt, last24h))),

      // ⏱️ Durée moyenne (24h)
      db
        .select({ avg: sql<number>`COALESCE(AVG(duration_ms)::int, 0)` })
        .from(apiLogs)
        .where(gte(apiLogs.createdAt, last24h)),

      // 🔥 Top 10 endpoints les plus utilisés
      db.execute(sql`
        SELECT 
          endpoint,
          COUNT(*)::int as count
        FROM api_logs
        WHERE created_at >= ${last24h.toISOString()}
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 10
      `),
    ]);

    // Traiter le trafic par heure (24h complètes)
    const trafficMap = new Map<number, { count: number; errors: number }>();
    for (let i = 0; i < 24; i++) {
      trafficMap.set(i, { count: 0, errors: 0 });
    }
    for (const row of trafficByHour.rows as {
      hour: number;
      count: number;
      errors: number;
    }[]) {
      trafficMap.set(Number(row.hour), {
        count: Number(row.count),
        errors: Number(row.errors),
      });
    }
    const trafficData = Array.from(trafficMap.entries())
      .map(([hour, data]) => ({
        hour: `${hour}h`,
        requests: data.count,
        errors: data.errors,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Traiter les status codes
    const statusData = (statusCodesStats.rows as {
      category: string;
      count: number;
    }[]).map((s) => ({
      name: s.category,
      value: Number(s.count),
      color:
        s.category === "2xx"
          ? "#10b981" // vert
          : s.category === "3xx"
          ? "#3b82f6" // bleu
          : s.category === "4xx"
          ? "#f59e0b" // orange
          : "#ef4444", // rouge
    }));

    // Traiter endpoints lents
    const slowEndpoints = (slowestEndpoints.rows as {
      endpoint: string;
      method: string;
      avg_duration: number;
      max_duration: number;
      call_count: number;
    }[]).map((e) => ({
      endpoint: e.endpoint,
      method: e.method,
      avgDuration: Number(e.avg_duration),
      maxDuration: Number(e.max_duration),
      callCount: Number(e.call_count),
    }));

    // Traiter top endpoints
    const topEndpointsData = (topEndpoints.rows as {
      endpoint: string;
      count: number;
    }[]).map((e) => ({
      endpoint: e.endpoint,
      count: Number(e.count),
    }));

    const totalRequests = Number(totalRequestsResult[0]?.count || 0);
    const totalErrors = Number(totalErrorsResult[0]?.count || 0);
    const avgDuration = Number(avgDurationResult[0]?.avg || 0);
    const errorRate =
      totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : "0";

    return NextResponse.json(
      {
        summary: {
          totalRequests,
          totalErrors,
          errorRate,
          avgDuration,
        },
        recentErrors,
        slowEndpoints,
        trafficData,
        statusData,
        topEndpoints: topEndpointsData,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Monitoring error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Purger les vieux logs (à appeler manuellement ou via cron)
export async function DELETE() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Supprimer les logs de plus de 7 jours
    await db.execute(sql`
      DELETE FROM api_logs 
      WHERE created_at < ${sevenDaysAgo.toISOString()}
    `);

    return NextResponse.json({ success: true, message: "Vieux logs supprimés" });
  } catch (error) {
    console.error("Delete logs error:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
