import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sql, eq, or } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer tous les utilisateurs avec leurs statistiques
    const allUsers = await db
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
      .orderBy(sql`${users.createdAt} DESC`);

    // Ajouter les stats pour chaque utilisateur
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const [likesGiven] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(likes)
          .where(eq(likes.fromUserId, user.id));

        const [likesReceived] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(likes)
          .where(eq(likes.toUserId, user.id));

        const [matchCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(matches)
          .where(or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id)));

        const [messageCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(eq(messages.senderId, user.id));

        return {
          ...user,
          stats: {
            likesGiven: likesGiven.count,
            likesReceived: likesReceived.count,
            matches: matchCount.count,
            messages: messageCount.count,
          },
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
