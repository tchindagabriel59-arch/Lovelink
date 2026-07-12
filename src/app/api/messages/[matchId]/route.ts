import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, matches, users } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdParam } = await params;
    const matchId = parseInt(matchIdParam);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];

    if (matchData.user1Id !== userId && matchData.user2Id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));

    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          eq(messages.isRead, false)
        )
      );

    const otherUserId =
      matchData.user1Id === userId ? matchData.user2Id : matchData.user1Id;

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
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdParam } = await params;
    const matchId = parseInt(matchIdParam);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];

    if (matchData.user1Id !== userId && matchData.user2Id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const recipientId =
      matchData.user1Id === userId ? matchData.user2Id : matchData.user1Id;

    const senderData = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const sender = senderData[0];

    const cleanContent = content.trim();

    const newMessage = await db
      .insert(messages)
      .values({
        matchId,
        senderId: userId,
        content: cleanContent,
        isRead: false,
      })
      .returning();

    const isPhoto = cleanContent.startsWith("[IMAGE]");

    const notifContent = isPhoto
      ? `📷 ${sender?.firstName ?? "Quelqu'un"} vous a envoyé une photo`
      : `💬 ${sender?.firstName ?? "Quelqu'un"} : ${cleanContent.substring(0, 50)}${cleanContent.length > 50 ? "..." : ""}`;

    await createNotification({
      userId: recipientId,
      type: "message",
      fromUserId: userId,
      content: notifContent,
    });

    const pushContent = isPhoto
      ? "📷 Vous a envoyé une photo"
      : cleanContent.substring(0, 100);

    await sendPushToUser(
      recipientId,
      PushTemplates.message(sender?.firstName ?? "Quelqu'un", pushContent)
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
