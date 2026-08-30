// src/lib/whatsapp.ts
// LoveLink — Envoi codes reset MDP via WhatsApp Cloud API (Meta)

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

/**
 * Normalise un numéro africain vers le format E.164 (sans +)
 * CM : 6XXXXXXXX / 2376XXXXXXXX → 2376XXXXXXXX
 * SN : 7X XXX XX XX / 2217XXXXXXXX → 2217XXXXXXXX
 * CI, etc. : garde le format international s'il est déjà bon
 */
export function normalizePhoneNumber(input: string): string {
  // Garde uniquement les chiffres
  let digits = input.replace(/\D/g, "");

  // Supprime le 00 international éventuel
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Cameroun : 6XXXXXXXX (9 chiffres) → 237…
  if (digits.length === 9 && digits.startsWith("6")) {
    return `237${digits}`;
  }
  // Cameroun déjà avec 237
  if (digits.startsWith("237") && digits.length === 12) {
    return digits;
  }

  // Sénégal : 7XXXXXXXX ou 70/76/77/78 (9 chiffres) → 221…
  if (digits.length === 9 && /^7[0-8]/.test(digits)) {
    return `221${digits}`;
  }
  // Sénégal déjà avec 221
  if (digits.startsWith("221") && digits.length === 12) {
    return digits;
  }

  // Côte d'Ivoire : 0XXXXXXXXX (10 chiffres) → 225…
  if (digits.length === 10 && digits.startsWith("0")) {
    return `225${digits.slice(1)}`;
  }
  if (digits.startsWith("225") && digits.length >= 12) {
    return digits;
  }

  // Déjà en international (autres pays) — on renvoie tel quel
  return digits;
}

/**
 * Génère les emails synthétiques possibles pour un numéro
 * (compatibilité avec le système auth hybride LoveLink)
 */
export function phoneToSyntheticEmails(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  const local = normalized.startsWith("237")
    ? normalized.slice(3)
    : normalized.startsWith("221")
      ? normalized.slice(3)
      : normalized;

  return [
    `phone_${normalized}@phone.lovelink237.com`,
    `phone_${local}@phone.lovelink237.com`,
    // Variante avec 237 collé si local CM
    ...(normalized.startsWith("237")
      ? [`phone_237${local}@phone.lovelink237.com`]
      : []),
  ];
}

interface SendResetCodeResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie le code de reset par WhatsApp.
 * 1) Tente un template approuvé (prod)
 * 2) Fallback message texte libre (mode test / dev)
 */
export async function sendWhatsAppResetCode(
  toPhone: string,
  code: string
): Promise<SendResetCodeResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("[WhatsApp] WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant");
    return { success: false, error: "Configuration WhatsApp manquante" };
  }

  const to = normalizePhoneNumber(toPhone);

  // Corps du message texte (fallback — marche en mode test Meta)
  const textBody =
    `🔐 *LoveLink* — Code de réinitialisation\n\n` +
    `Ton code est : *${code}*\n\n` +
    `Il expire dans 15 minutes.\n` +
    `Si tu n'as pas demandé ce code, ignore ce message.`;

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  // --- Tentative 1 : template (à activer quand approuvé en prod) ---
  const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_RESET || ""; // ex: lovelink_reset_code
  if (TEMPLATE_NAME) {
    try {
      const templatePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templatePayload),
      });

      const data = await res.json();

      if (res.ok && data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }

      console.warn("[WhatsApp] Template échoué, fallback texte:", data);
    } catch (err) {
      console.warn("[WhatsApp] Erreur template, fallback texte:", err);
    }
  }

  // --- Tentative 2 : message texte libre (mode test) ---
  try {
    const textPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: textBody,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp] Erreur API:", data);
      return {
        success: false,
        error: data?.error?.message || "Échec envoi WhatsApp",
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    console.error("[WhatsApp] Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau WhatsApp",
    };
  }
}
