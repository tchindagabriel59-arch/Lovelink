import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sql, or, eq } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // ⚡ OPTIMISATION MAJEURE : 5 requêtes TOTAL au lieu de 876 !
    // Toutes les requêtes lancées EN PARALLÈLE avec Promise.all
    const [
      allUsers,
      likesGivenStats,
      likesReceivedStats,
      matchesStats,
      messagesStats,
    ] = await Promise.all([
      // 1. Tous les utilisateurs
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          birthDate: users.birthDate,
          gender: users.gender,
          city: users.city,
          country: users.country,
          photoUrl: users.photoUrl,
          bio: users.bio,
          occupation: users.occupation,
          isOnline: users.isOnline,
          isAdmin: users.isAdmin,
          isBanned: users.isBanned,
          isPremium: users.isPremium,
          lastSeen: users.lastSeen,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`),

      // 2. TOUS les likes donnés (groupés par fromUserId)
      db
        .select({
          userId: likes.fromUserId,
          count: sql<number>`count(*)::int`,
        })
        .from(likes)
        .groupBy(likes.fromUserId),

      // 3. TOUS les likes reçus (groupés par toUserId)
      db
        .select({
          userId: likes.toUserId,
          count: sql<number>`count(*)::int`,
        })
        .from(likes)
        .groupBy(likes.toUserId),

      // 4. TOUS les matchs (comptés pour user1 ET user2)
      // On utilise UNION pour compter les matchs des 2 côtés
      db.execute(sql`
        SELECT user_id, COUNT(*)::int as count
        FROM (
          SELECT user1_id as user_id FROM matches
          UNION ALL
          SELECT user2_id as user_id FROM matches
        ) all_matches
        GROUP BY user_id
      `),

      // 5. TOUS les messages envoyés (groupés par senderId)
      db
        .select({
          userId: messages.senderId,
          count: sql<number>`count(*)::int`,
        })
        .from(messages)
        .groupBy(messages.senderId),
    ]);

    // ✅ Créer des Maps pour accès O(1) (ultra rapide)
    const likesGivenMap = new Map<number, number>(
      likesGivenStats.map((s) => [s.userId, s.count])
    );
    const likesReceivedMap = new Map<number, number>(
      likesReceivedStats.map((s) => [s.userId, s.count])
    );
    const messagesMap = new Map<number, number>(
      messagesStats.map((s) => [s.userId, s.count])
    );

    // Pour les matchs, on récupère les rows du sql.execute
    const matchesMap = new Map<number, number>();
    for (const row of matchesStats.rows as { user_id: number; count: number }[]) {
      matchesMap.set(row.user_id, Number(row.count));
    }

    // ✅ Assembler le résultat final (aucune requête SQL supplémentaire)
    const usersWithStats = allUsers.map((user) => ({
      ...user,
      stats: {
        likesGiven: likesGivenMap.get(user.id) || 0,
        likesReceived: likesReceivedMap.get(user.id) || 0,
        matches: matchesMap.get(user.id) || 0,
        messages: messagesMap.get(user.id) || 0,
      },
    }));

    return NextResponse.json(
      { users: usersWithStats },
      {
        headers: {
          // Cache 30 secondes pour éviter recharge inutile
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
