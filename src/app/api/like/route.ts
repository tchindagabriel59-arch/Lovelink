import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { sendMatchEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { toUserId, isLike, isSuperLike } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Record the like/dislike/superlike
    await db.insert(likes).values({
      fromUserId: userId,
      toUserId,
      isLike: isLike !== false,
      isSuperLike: isSuperLike === true,
    });

    let isMatch = false;
    let matchedUser = null;

    // Check if there's a mutual like
    if (isLike !== false) {
      const [mutual] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.fromUserId, toUserId),
            eq(likes.toUserId, userId),
            eq(likes.isLike, true)
          )
        )
        .limit(1);

      if (mutual) {
        // Create match
        const user1 = Math.min(userId, toUserId);
        const user2 = Math.max(userId, toUserId);

        const existingMatch = await db
          .select()
          .from(matches)
          .where(and(eq(matches.user1Id, user1), eq(matches.user2Id, user2)))
          .limit(1);

        if (existingMatch.length === 0) {
          await db.insert(matches).values({
            user1Id: user1,
            user2Id: user2,
          });
          isMatch = true;

          // Récupérer les infos des 2 utilisateurs pour les emails
          const bothUsers = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              photoUrl: users.photoUrl,
            })
            .from(users)
            .where(eq(users.id, userId));

          const [currentUser] = bothUsers;

          const [otherUser] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              photoUrl: users.photoUrl,
            })
            .from(users)
            .where(eq(users.id, toUserId))
            .limit(1);

          matchedUser = otherUser;

          // 📧 Envoyer emails de notification aux 2 utilisateurs
          if (currentUser && otherUser) {
            sendMatchEmail(currentUser.email, currentUser.firstName, otherUser.firstName).catch(
              (err) => console.error("Erreur email match user1:", err)
            );
            sendMatchEmail(otherUser.email, otherUser.firstName, currentUser.firstName).catch(
              (err) => console.error("Erreur email match user2:", err)
            );
          }
        }
      }
    }

    // Si pas de match mais on n'a pas encore les infos du user matché
    if (!matchedUser && isMatch) {
      const [mu] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          photoUrl: users.photoUrl,
        })
        .from(users)
        .where(eq(users.id, toUserId))
        .limit(1);
      matchedUser = mu;
    }

    return NextResponse.json({ success: true, isMatch, matchedUser });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
