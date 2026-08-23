// ============================================
// 🤖 HELPER TELEGRAM ALERTS - LOVELINK
// ============================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

/**
 * Envoie un message d'alerte sur Telegram
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ Telegram non configuré (TOKEN ou CHAT_ID manquant)");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("❌ Telegram error:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Telegram send failed:", error);
    return false;
  }
}

/**
 * Formate un message propre pour un paiement / boost
 */
export function formatPaymentAlert(params: {
  type: "intent" | "paid" | "manual_cm";
  userId: number | string;
  firstName?: string | null;
  lastName?: string | null;
  plan?: string | null;
  period?: string | null;
  amount?: number | null;
  currency?: string | null;
  gateway?: string | null;
  tx?: string | null;
  phone?: string | null;
}) {
  const name = [params.firstName, params.lastName].filter(Boolean).join(" ") || "Utilisateur";
  const amountStr =
    params.amount != null
      ? `${Number(params.amount).toLocaleString("fr-FR")} ${params.currency || "FCFA"}`
      : "—";

  const title =
    params.type === "paid"
      ? "✅ PAIEMENT VALIDÉ !"
      : params.type === "manual_cm"
      ? "🇨🇲 PAIEMENT MANUEL CM (À VALIDER)"
      : "🧾 INTENTION DE PAIEMENT";

  return (
    `<b>${title}</b>\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `👤 <b>${escapeHtml(name)}</b> (ID: ${params.userId})\n` +
    `📦 <b>${escapeHtml(String(params.plan || "—"))}</b> (${escapeHtml(String(params.period || "—"))})\n` +
    `💰 <b>${amountStr}</b>\n` +
    `🏦 Mode: ${escapeHtml(params.gateway || "—")}\n` +
    (params.phone ? `📱 Tel: <code>${escapeHtml(params.phone)}</code>\n` : "") +
    (params.tx ? `🔗 TX: <code>${escapeHtml(params.tx)}</code>\n` : "") +
    `━━━━━━━━━━━━━━━━\n` +
    `🌐 <a href="https://lovelink237.com">LoveLink</a>`
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
