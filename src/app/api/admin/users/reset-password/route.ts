// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function notifyTelegramBackground(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch((err) => console.error("[Admin-Reset] Telegram err:", err));
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const rawId = body?.userId ?? body?.id ?? body?.targetUserId;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, error: "ID utilisateur manquant." }, { status: 400 });
    }

    // Génération du code Lk-XXXXXXXX
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const temporaryPassword = `Lk-${randomCode}`;

    // Hash bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Valide 24h

    // 1. Mettre à jour le mot de passe utilisateur dans users
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    // 2. Enregistrer aussi dans passwordResetTokens pour la recherche rapide
    try {
      await db.insert(passwordResetTokens).values({
        userId,
        codeHash: passwordHash,
        expiresAt,
      });
    } catch (e) {
      console.warn("[Admin-Reset] Erreur insertion token table:", e);
    }

    console.log(`[Admin-Reset] ✅ Code généré pour User #${userId} : ${temporaryPassword}`);

    notifyTelegramBackground(
      `<b>🔑 NOUVEAU CODE D'ACCÈS</b>\n\nUser ID : ${userId}\nCode : <code>${temporaryPassword}</code>`
    );

    return NextResponse.json({
      success: true,
      ok: true,
      password: temporaryPassword,
      temporaryPassword: temporaryPassword,
      message: temporaryPassword,
    });
  } catch (error: any) {
    console.error("[Admin-Reset] Erreur serveur:", error);
    return NextResponse.json({ success: false, error: "Erreur lors de la génération." }, { status: 500 });
  }
}
