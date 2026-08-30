// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { or, eq } from "drizzle-orm";
import {
  normalizePhoneNumber,
  phoneToSyntheticEmails,
} from "@/lib/whatsapp";

// Ton numéro WhatsApp Admin Boss (Cameroun)
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER || "237651387914";

async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Forgot-Manual] Telegram error:", e);
    return false;
  }
}

async function notifyAdminWhatsApp(text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizePhoneNumber(ADMIN_WHATSAPP),
          type: "text",
          text: { preview_url: false, body: text },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[Forgot-Manual] WhatsApp admin error:", data);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Forgot-Manual] WhatsApp admin exception:", e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();

    if (fullName.length < 3) {
      return NextResponse.json(
        { error: "Indique ton nom complet utilisé à l'inscription." },
        { status: 400 }
      );
    }

    if (phone.length < 8) {
      return NextResponse.json(
        { error: "Indique ton numéro WhatsApp pour te recontacter." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    // Sélection uniquement des colonnes garanties : id, email
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));

    const matchedUsers = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(or(...emailConditions))
      .limit(5);

    const matchLines =
      matchedUsers.length > 0
        ? matchedUsers
            .map((u) => `• User ID: ${u.id} | Email: ${u.email || "n/a"}`)
            .join("\n")
        : "• Aucun compte trouvé par numéro (à chercher par le nom dans le panel admin)";

    const telegramText =
      `<b>🔐 Demande reset MDP LoveLink</b>\n\n` +
      `<b>Nom saisi :</b> ${fullName}\n` +
      `<b>WhatsApp client :</b> ${normalizedPhone}\n\n` +
      `<b>Correspondances BDD :</b>\n${matchLines}\n\n` +
      `➡️ Va dans Admin (/gabriel-boss/utilisateurs) → cherche "${fullName}" ou "${normalizedPhone}" → génère un MDP temporaire et envoie-le sur WhatsApp.`;

    const whatsappText =
      `🔐 *Demande reset MDP LoveLink*\n\n` +
      `Nom saisi : ${fullName}\n` +
      `WhatsApp client : ${normalizedPhone}\n\n` +
      `Correspondances BDD :\n${matchLines}\n\n` +
      `➡️ Admin (/gabriel-boss/utilisateurs) → cherche "${fullName}" ou "${normalizedPhone}" → Générer un mot de passe temporaire.`;

    const tgOk = await notifyTelegram(telegramText);
    const waOk = await notifyAdminWhatsApp(whatsappText);

    console.log(
      `[Forgot-Manual] Demande de "${fullName}" (${normalizedPhone}) | matches=${matchedUsers.length} | tg=${tgOk} | wa=${waOk}`
    );

    return NextResponse.json({
      success: true,
      message:
        "Demande envoyée ✅. Tu recevras ton nouveau mot de passe sur WhatsApp très bientôt.",
    });
  } catch (error) {
    console.error("[Forgot-Manual] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer la demande. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
