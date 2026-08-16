import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, matches, users } from "@/db/schema";
import { eq, and, asc, ne } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";
import { requirePhoto } from "@/lib/photo-check";
import { logApiCall } from "@/lib/api-logger";

// ═══════════════════════════════════════
// GET : Récupérer les messages d'une conversation
// ═══════════════════════════════════════
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  // ✅ MONITORING
  const startTime = Date.now();
  const endpoint = "/api/messages/[matchId]";
  const method = "GET";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        errorMessage: "Utilisateur non authentifié",
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { matchId: matchIdParam } = await params;
    const matchId = parseInt(matchIdParam);

    if (isNaN(matchId)) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `matchId invalide: ${matchIdParam}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    // ⚡ 1 seule requête pour vérifier le match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 404,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Match introuvable: ${matchId}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];

    if (matchData.user1Id !== userId && matchData.user2Id !== userId) {
      logApiCall({
        endpoint,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Accès refusé au match ${matchId}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const otherUserId =
      matchData.user1Id === userId ? matchData.user2Id : matchData.user1Id;

    // ⚡ 3 requêtes EN PARALLÈLE
    const [allMessages, otherUser, _updateResult] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(eq(messages.matchId, matchId))
        .orderBy(asc(messages.createdAt)),

      db
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
        .limit(1),

      db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.matchId, matchId),
            eq(messages.isRead, false),
            ne(messages.senderId, userId)
          )
        ),
    ]);

    // ✅ LOG : Succès 200
    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: `${allMessages.length} messages chargés (match ${matchId})`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      messages: allMessages,
      otherUser: otherUser[0] ?? null,
      matchId,
    });
  } catch (error) {
    console.error("Erreur GET messages:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      errorMessage,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ═══════════════════════════════════════
// POST : Envoyer un nouveau message
// ═══════════════════════════════════════
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  // ✅ MONITORING
  const startTime = Date.now();
  const endpoint = "/api/messages/[matchId]";
  const method = "POST";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        errorMessage: "Utilisateur non authentifié",
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Blocage si pas de photo
    const photoCheck = await requirePhoto(userId);
    if (photoCheck) {
      logApiCall({
        endpoint,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Envoi message bloqué (pas de photo)",
        userAgent,
        ipAddress,
      });

      return photoCheck;
    }

    const { matchId: matchIdParam } = await params;
    const matchId = parseInt(matchIdParam);

    if (isNaN(matchId)) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `matchId invalide: ${matchIdParam}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Match invalide" }, { status: 400 });
    }

    const { content } = await req.json();

    if (!content || content.trim() === "") {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Message vide",
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // ⚡ Récupérer match + sender EN PARALLÈLE
    const [match, senderData] = await Promise.all([
      db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .limit(1),

      db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
    ]);

    if (match.length === 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 404,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Match introuvable: ${matchId}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = match[0];
    const sender = senderData[0];

    if (matchData.user1Id !== userId && matchData.user2Id !== userId) {
      logApiCall({
        endpoint,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Accès refusé au match ${matchId}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const recipientId =
      matchData.user1Id === userId ? matchData.user2Id : matchData.user1Id;

    const cleanContent = content.trim();

    // Insérer le message
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
      : `💬 ${sender?.firstName ?? "Quelqu'un"} : ${cleanContent.substring(0, 50)}${
          cleanContent.length > 50 ? "..." : ""
        }`;

    const pushContent = isPhoto
      ? "📷 Vous a envoyé une photo"
      : cleanContent.substring(0, 100);

    // ⚡ Notification + Push EN PARALLÈLE
    Promise.all([
      createNotification({
        userId: recipientId,
        type: "message",
        fromUserId: userId,
        content: notifContent,
      }),
      sendPushToUser(
        recipientId,
        PushTemplates.message(sender?.firstName ?? "Quelqu'un", pushContent)
      ),
    ]).catch((err) => {
      console.error("Notification error (non-blocking):", err);
    });

    // ✅ LOG : Succès 200 - message envoyé
    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId,
      errorMessage: isPhoto
        ? `📷 Photo envoyée à user ${recipientId}`
        : `💬 Message envoyé à user ${recipientId} (${cleanContent.length} chars)`,
      userAgent,
      ipAddress,
    });

    // Retour immédiat au client
    return NextResponse.json({
      success: true,
      message: newMessage[0],
    });
  } catch (error) {
    console.error("Erreur POST message:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      errorMessage,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
