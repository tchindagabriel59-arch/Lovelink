// src/app/api/messages/send/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, matches } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { requirePhoto } from "@/lib/photo-check";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";
import { logApiCall } from "@/lib/api-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const startTime = Date.now();
  const endpoint = "/api/messages/send";
  const method = "POST";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || undefined;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logApiCall({ endpoint, method, statusCode: 401, durationMs: Date.now() - startTime, errorMessage: "Non autorisé", userAgent, ipAddress });
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const photoCheck = await requirePhoto(userId);
    if (photoCheck) {
      logApiCall({ endpoint, method, statusCode: 403, durationMs: Date.now() - startTime, userId, errorMessage: "Pas de photo requise", userAgent, ipAddress });
      return photoCheck;
    }

    const body = await req.json();
    const receiverId = Number(body.receiverId || body.toUserId);
    const content = String(body.content || body.message || "").trim();

    if (!receiverId || isNaN(receiverId)) {
      logApiCall({ endpoint, method, statusCode: 400, durationMs: Date.now() - startTime, userId, errorMessage: "receiverId manquant", userAgent, ipAddress });
      return NextResponse.json({ error: "Destinataire manquant" }, { status: 400 });
    }

    if (!content) {
      logApiCall({ endpoint, method, statusCode: 400, durationMs: Date.now() - startTime, userId, errorMessage: "Message vide", userAgent, ipAddress });
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // Vérifier / créer le match
    const [existingMatch] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.user1Id, userId), eq(matches.user2Id, receiverId)),
          and(eq(matches.user1Id, receiverId), eq(matches.user2Id, userId))
        )
      )
      .limit(1);

    let matchId: number;

    if (existingMatch) {
      matchId = existingMatch.id;
    } else {
      const [newMatch] = await db
        .insert(matches)
        .values({
          user1Id: userId,
          user2Id: receiverId,
          matchedAt: new Date(),
        })
        .returning({ id: matches.id });

      if (!newMatch) {
        throw new Error("Échec création du match");
      }
      matchId = newMatch.id;
    }

    // Insérer le message
    const [msg] = await db
      .insert(messages)
      .values({
        matchId,
        senderId: userId,
        content,
        isRead: false,
      })
      .returning();

    // Notifier le destinataire (sans bloquer)
    Promise.all([
      createNotification({
        userId: receiverId,
        type: "message",
        fromUserId: userId,
        content: `💬 Nouveau message : ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
      }),
      sendPushToUser(receiverId, PushTemplates.message("Quelqu'un", content.substring(0, 60))),
    ]).catch((e) => console.error("Notif non bloquante:", e));

    logApiCall({ endpoint, method, statusCode: 200, durationMs: Date.now() - startTime, userId, errorMessage: `Message envoyé au match ${matchId}`, userAgent, ipAddress });

    return NextResponse.json({ success: true, message: msg, matchId });
  } catch (error) {
    console.error("Erreur POST /api/messages/send:", error);
    const msg = error instanceof Error ? error.message : String(error);
    logApiCall({ endpoint, method, statusCode: 500, durationMs: Date.now() - startTime, errorMessage: msg, userAgent, ipAddress });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
