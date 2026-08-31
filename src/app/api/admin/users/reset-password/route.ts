// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  // fire-and-forget (ne bloque pas la réponse)
  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const userId = Number(body.userId ?? body.id ?? body.targetUserId);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }

    // Code lisible : Lk-XXXXXXXX
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let random = "";
    for (let i = 0; i < 8; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const temporaryPassword = `Lk-${random}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1) Update mot de passe user
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    // 2) Stocke aussi le token (pour retrouver le compte par le code)
    try {
      await db.insert(passwordResetTokens).values({
        userId,
        codeHash: passwordHash,
        expiresAt,
      });
    } catch (e) {
      console.warn("[Admin-Reset] password_reset_tokens insert failed:", e);
    }

    console.log(`[Admin-Reset] OK user #${userId} → ${temporaryPassword}`);

    notifyTelegram(
      `<b>🔑 CODE RESET LOVELINK</b>\n\nUser ID: <code>${userId}</code>\nCode: <code>${temporaryPassword}</code>`
    );

    // Réponse compatible avec le plus grand nombre de frontends admin
    return NextResponse.json({
      success: true,
      ok: true,
      password: temporaryPassword,
      temporaryPassword,
      newPassword: temporaryPassword,
      message: temporaryPassword,
      data: {
        password: temporaryPassword,
        temporaryPassword,
      },
    });
  } catch (error: any) {
    console.error("[Admin-Reset] FATAL:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
