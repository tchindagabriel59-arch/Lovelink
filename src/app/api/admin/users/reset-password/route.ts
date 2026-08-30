// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Envoi Telegram en arrière-plan (NE BLOQUE PAS l'API)
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
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawId = body?.userId ?? body?.id ?? body?.targetUserId;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }

    // Génération du code Lk-XXXXXXXX (8 caractères)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const temporaryPassword = `Lk-${randomCode}`;

    // Hash bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Mise à jour Neon
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    console.log(`[Admin-Reset] ✅ Mot de passe généré pour User #${userId} : ${temporaryPassword}`);

    // Notification Telegram sans await (instantané)
    notifyTelegramBackground(
      `<b>🔑 MOT DE PASSE GÉNÉRÉ</b>\n\nUser ID : ${userId}\nCode : <code>${temporaryPassword}</code>`
    );

    // Réponse immédiate pour le frontend
    return NextResponse.json({
      success: true,
      ok: true,
      password: temporaryPassword,
      temporaryPassword: temporaryPassword,
      message: temporaryPassword,
    });
  } catch (error: any) {
    console.error("[Admin-Reset] Erreur serveur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération." },
      { status: 500 }
    );
  }
}
