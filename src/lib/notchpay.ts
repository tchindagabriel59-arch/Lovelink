// ============================================
// 💳 HELPER NOTCH PAY - CAMEROUN (XAF)
// ============================================
import crypto from "crypto";

const NOTCHPAY_PUBLIC_KEY = process.env.NOTCHPAY_PUBLIC_KEY || "";
const NOTCHPAY_SECRET_KEY = process.env.NOTCHPAY_SECRET_KEY || "";
const NOTCHPAY_HASH_KEY = process.env.NOTCHPAY_HASH_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

export interface NotchPayInitializeParams {
  email: string;
  amount: number;
  currency?: string; // "XAF" par défaut
  reference: string;
  description: string;
  callback: string;
  user_name?: string;
}

/**
 * Initialise un paiement Notch Pay (Orange Money / MTN Cameroun / Carte)
 */
export async function createNotchPayPayment(
  params: NotchPayInitializeParams
): Promise<{ authorization_url: string; reference: string }> {
  try {
    const response = await fetch("https://api.notchpay.co/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: NOTCHPAY_PUBLIC_KEY,
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        currency: params.currency || "XAF",
        reference: params.reference,
        description: params.description,
        callback: params.callback,
        name: params.user_name || "",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.authorization_url) {
      console.error("❌ Erreur NotchPay:", data);
      throw new Error(data.message || "Erreur d'initialisation NotchPay");
    }

    return {
      authorization_url: data.authorization_url,
      reference: data.transaction?.reference || params.reference,
    };
  } catch (error) {
    console.error("❌ Erreur createNotchPayPayment:", error);
    throw error;
  }
}

/**
 * Vérifie la signature Webhook Notch Pay grâce à la Clé de Hachage
 */
export function verifyNotchPaySignature(payload: string, signature: string): boolean {
  if (!NOTCHPAY_HASH_KEY || !signature) return false;
  
  const hmac = crypto
    .createHmac("sha256", NOTCHPAY_HASH_KEY)
    .update(payload)
    .digest("hex");

  return hmac === signature;
}
