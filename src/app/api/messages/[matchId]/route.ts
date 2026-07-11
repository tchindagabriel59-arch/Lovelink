import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, matches, users, blocks } from "@/db/schema";
import { eq, and, or, asc, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdStr } = await params;
    const matchId = parseInt(matchIdStr, 10);

    const [match] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // Vérifier blocage
    const [blockCheck] = await db
      .select()
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerUserId, userId), eq(blocks.blockedUserId, otherId)),
          and(eq(blocks.blockerUserId, otherId), eq(blocks.blockedUserId, userId))
        )
      )
      .limit(1);

    if (blockCheck) {
      return NextResponse.json({ error: "Conversation impossible" }, { status: 403 });
    }

    const [otherUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        isOnline: users.isOnline,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .where(eq(users.id, otherId))
      .limit(1);

    const msgs = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));

    // Marquer messages comme lus
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          eq(messages.isRead, false),
          sql`${messages.senderId} != ${userId}`
        )
      );

    return NextResponse.json({ messages: msgs, otherUser });
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdStr } = await params;
    const matchId = parseInt(matchIdStr, 10);

    const [match] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // Vérifier blocage
    const [blockCheck] = await db
      .select()
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerUserId, userId), eq(blocks.blockedUserId, otherId)),
          and(eq(blocks.blockerUserId, otherId), eq(blocks.blockedUserId, userId))
        )
      )
      .limit(1);

    if (blockCheck) {
      return NextResponse.json({ error: "Impossible d'envoyer un message" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide" },
        { status: 400 }
      );
    }

    const [newMsg] = await db
      .insert(messages)
      .values({
        matchId,
        senderId: userId,
        content: content.trim(),
      })
      .returning();

    // Récupérer mon prénom pour la notification
    const [currentUser] = await db
      .select({ firstName: users.firstName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Créer notification pour l'autre
    if (currentUser) {
      await createNotification({
        userId: otherId,
        type: "message",
        fromUserId: userId,
        content: `t'a envoyé un message`,
      });
    }

    return NextResponse.json({ message: newMsg });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
