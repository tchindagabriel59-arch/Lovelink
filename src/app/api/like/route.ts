import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likes, matches, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { sendMatchEmail } from "@/lib/emails";
import { createNotification } from "@/lib/notifications";

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

    await db.insert(likes).values({
      fromUserId: userId,
      toUserId,
      isLike: isLike !== false,
      isSuperLike: isSuperLike === true,
    });

    let isMatch = false;
    let matchedUser = null;

    // 🔔 Créer une notification pour la personne likée (si c'est un like)
    if (isLike !== false) {
      await createNotification({
        userId: toUserId,
        type: isSuperLike ? "super_like" : "like",
        fromUserId: userId,
        content: isSuperLike ? "t'a super liké !" : "t'a liké !",
      });
    }

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

          // Récupérer les infos des 2 utilisateurs
          const [currentUser] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              photoUrl: users.photoUrl,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

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

          // 🔔 Créer notifications de match pour les 2 utilisateurs
          if (currentUser && otherUser) {
            await createNotification({
              userId: currentUser.id,
              type: "match",
              fromUserId: otherUser.id,
              content: `Nouveau match avec ${otherUser.firstName} !`,
            });
            await createNotification({
              userId: otherUser.id,
              type: "match",
              fromUserId: currentUser.id,
              content: `Nouveau match avec ${currentUser.firstName} !`,
            });

            // 📧 Emails
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
