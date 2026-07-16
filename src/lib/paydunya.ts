// ============================================
// 💳 HELPER PAYDUNYA - API v1
// ============================================
// Documentation : https://paydunya.com/developers
// Basé au Sénégal 🇸🇳 - Support multi-pays Afrique
// ============================================

const PAYDUNYA_MODE = process.env.PAYDUNYA_MODE || "test";
const PAYDUNYA_BASE_URL =
  PAYDUNYA_MODE === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";

const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY!;
const PUBLIC_KEY = process.env.PAYDUNYA_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY!;
const TOKEN = process.env.PAYDUNYA_TOKEN!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

// ============================================
// TYPES
// ============================================
export interface PayDunyaInvoiceItem {
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  description: string;
}

export interface PayDunyaCreateInvoiceRequest {
  invoice: {
    total_amount: number;
    description: string;
    items?: Record<string, PayDunyaInvoiceItem>;
  };
  store: {
    name: string;
    tagline?: string;
    postal_address?: string;
    phone?: string;
    website_url?: string;
    logo_url?: string;
  };
  custom_data?: Record<string, string>;
  actions?: {
    cancel_url?: string;
    return_url?: string;
    callback_url?: string;
  };
}

export interface PayDunyaCreateInvoiceResponse {
  response_code: string;      // "00" = success
  response_text: string;
  description?: string;
  token?: string;              // Token de la transaction PayDunya
  invoice_url?: string;        // URL de paiement à ouvrir
}

export interface PayDunyaVerifyResponse {
  response_code: string;       // "00" = success
  response_text: string;
  hash?: string;
  invoice?: {
    token: string;
    pal_is_on: number;
    total_amount: number;
    total_amount_without_fees: number;
    description: string;
    expire_date: string;
    items: Record<string, PayDunyaInvoiceItem>;
    taxes: any[];
  };
  custom_data?: Record<string, string>;
  actions?: any;
  mode?: string;
  status: "completed" | "cancelled" | "pending" | "failed";
  fail_reason?: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  receipt_identifier?: string;
  receipt_url?: string;
  provider_reference?: string;
}

// ============================================
// 🔑 HEADERS COMMUNS
// ============================================
function getPayDunyaHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "PAYDUNYA-MASTER-KEY": MASTER_KEY,
    "PAYDUNYA-PRIVATE-KEY": PRIVATE_KEY,
    "PAYDUNYA-TOKEN": TOKEN,
  };
}

// ============================================
// 💳 CRÉER UNE FACTURE (invoice) PAYDUNYA
// ============================================
export async function createPayDunyaInvoice(
  params: PayDunyaCreateInvoiceRequest
): Promise<PayDunyaCreateInvoiceResponse> {
  try {
    const response = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/create`, {
      method: "POST",
      headers: getPayDunyaHeaders(),
      body: JSON.stringify(params),
    });

    const data: PayDunyaCreateInvoiceResponse = await response.json();

    if (data.response_code !== "00") {
      console.error("❌ PayDunya create invoice failed:", data);
      throw new Error(
        data.response_text ||
          data.description ||
          "PayDunya invoice creation failed"
      );
    }

    return data;
  } catch (error) {
    console.error("❌ Erreur createPayDunyaInvoice:", error);
    throw error;
  }
}

// ============================================
// 🔍 VÉRIFIER UNE FACTURE PAYDUNYA (source de vérité)
// ============================================
export async function verifyPayDunyaInvoice(
  token: string
): Promise<PayDunyaVerifyResponse> {
  try {
    const response = await fetch(
      `${PAYDUNYA_BASE_URL}/checkout-invoice/confirm/${token}`,
      {
        method: "GET",
        headers: getPayDunyaHeaders(),
      }
    );

    const data: PayDunyaVerifyResponse = await response.json();

    if (!response.ok) {
      console.error("❌ PayDunya verify failed:", data);
      throw new Error(`PayDunya verify failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Erreur verifyPayDunyaInvoice:", error);
    throw error;
  }
}

// ============================================
// 🛠️ HELPERS UTILITAIRES
// ============================================

/**
 * Génère un merchant_transaction_id unique
 * Format: LL[USERID][TIMESTAMP][RANDOM] (max 30 caractères)
 */
export function generateMerchantTransactionId(userId: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `LL${userId}${timestamp}${random}`.substring(0, 30);
}

/**
 * Retourne les URLs de callback pour un paiement
 */
export function getPaymentUrls(merchantTransactionId: string) {
  return {
    return_url: `${SITE_URL}/premium/success?tx=${merchantTransactionId}`,
    cancel_url: `${SITE_URL}/premium/failed?tx=${merchantTransactionId}`,
    callback_url: `${SITE_URL}/api/payment/webhook`,
  };
}

// ============================================
// 💰 TARIFS PREMIUM (Option B)
// ============================================
export const PREMIUM_PRICING = {
  premium: {
    monthly: 2500,   // 2 500 FCFA/mois
    yearly: 21000,   // 21 000 FCFA/an (-30%)
  },
  gold: {
    monthly: 5000,   // 5 000 FCFA/mois
    yearly: 42000,   // 42 000 FCFA/an (-30%)
  },
} as const;

export type PremiumPlan = "premium" | "gold";
export type BillingPeriod = "monthly" | "yearly";

/**
 * Retourne le montant en FCFA pour un plan + période
 */
export function getPremiumPrice(plan: PremiumPlan, period: BillingPeriod): number {
  return PREMIUM_PRICING[plan][period];
}

/**
 * Calcule la date d'expiration à partir d'aujourd'hui
 */
export function getSubscriptionExpiryDate(period: BillingPeriod): Date {
  const now = new Date();
  if (period === "monthly") {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
}

/**
 * Retourne un libellé pour la désignation PayDunya
 */
export function getPaymentDesignation(plan: PremiumPlan, period: BillingPeriod): string {
  const planLabel = plan === "premium" ? "Premium" : "Gold";
  const periodLabel = period === "monthly" ? "1 mois" : "1 an";
  return `LoveLink ${planLabel} - ${periodLabel}`;
}
