import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, matches, users } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const matchId = parseInt(params.matchId);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur fait partie du match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];
    if (
      matchData.user1Id !== authUser.id &&
      matchData.user2Id !== authUser.id
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les messages
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));

    // Marquer les messages comme lus
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          eq(messages.isRead, false)
        )
      );

    // Récupérer infos de l'autre utilisateur
    const otherUserId =
      matchData.user1Id === authUser.id
        ? matchData.user2Id
        : matchData.user1Id;

    const otherUser = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    return NextResponse.json({
      messages: allMessages,
      otherUser: otherUser[0] ?? null,
      matchId,
    });
  } catch (error) {
    console.error("Erreur GET messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const matchId = parseInt(params.matchId);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    const { content } = await req.json();
    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur fait partie du match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];
    if (
      matchData.user1Id !== authUser.id &&
      matchData.user2Id !== authUser.id
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Destinataire = l'autre utilisateur
    const recipientId =
      matchData.user1Id === authUser.id
        ? matchData.user2Id
        : matchData.user1Id;

    // Récupérer infos de l'expéditeur
    const senderData = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const sender = senderData[0];

    // Insérer le message
    const newMessage = await db
      .insert(messages)
      .values({
        matchId,
        senderId: authUser.id,
        content: content.trim(),
        isRead: false,
      })
      .returning();

    // Notification in-app
    const isPhoto = content.trim().startsWith("[IMAGE]");
    const notifContent = isPhoto
      ? `📷 ${sender?.firstName ?? "Quelqu'un"} vous a envoyé une photo`
      : `💬 ${sender?.firstName ?? "Quelqu'un"} : ${content.trim().substring(0, 50)}${content.trim().length > 50 ? "..." : ""}`;

    await createNotification({
      userId: recipientId,
      type: "message",
      fromUserId: authUser.id,
      content: notifContent,
    });

    // 🔔 Push notification MESSAGE
    const pushContent = isPhoto
      ? "📷 Vous a envoyé une photo"
      : content.trim().substring(0, 100);

    await sendPushToUser(
      recipientId,
      PushTemplates.message(
        sender?.firstName ?? "Quelqu'un",
        pushContent
      )
    );

    return NextResponse.json({
      success: true,
      message: newMessage[0],
    });
  } catch (error) {
    console.error("Erreur POST message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
