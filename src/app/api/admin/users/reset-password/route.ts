// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Fonction pour t'envoyer le code sur Telegram
async function sendToTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("Erreur Telegram:", e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = Number(body.userId || body.id);

    if (!userId) {
      return NextResponse.json({ success: false, error: "ID manquant" }, { status: 200 });
    }

    // 1. Générer le code
    const code = Math.random().toString(36).slice(-8).toUpperCase();
    const tempPass = `Lk-${code}`;

    // 2. Hacher et mettre à jour la BDD
    const hash = await bcrypt.hash(tempPass, 10);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));

    // 3. ENVOYER LE CODE SUR TELEGRAM (Pour que tu l'aies quoi qu'il arrive)
    await sendToTelegram(`<b>🔑 NOUVEAU MOT DE PASSE GÉNÉRÉ</b>\n\nID Utilisateur : ${userId}\nCode à envoyer : <code>${tempPass}</code>`);

    console.log(`[ADMIN] OK pour ID ${userId} : ${tempPass}`);

    // 4. Réponse ultra-courte pour éviter le bug réseau du front
    return NextResponse.json({
      success: true,
      password: tempPass,
      temporaryPassword: tempPass
    }, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Admin:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
