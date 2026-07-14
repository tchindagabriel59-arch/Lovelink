// ============================================
// 💳 HELPER CINETPAY - API v1.0 Aurore
// ============================================
// Documentation : https://api.cinetpay.net
// Gère : Login (token cache 24h), Paiements, Vérification
// ============================================

const CINETPAY_BASE_URL = "https://api.cinetpay.net";
const API_KEY = process.env.CINETPAY_API_KEY!;
const API_PASSWORD = process.env.CINETPAY_API_PASSWORD!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

// ============================================
// 🔑 CACHE DU TOKEN (évite de re-login à chaque appel)
// ============================================
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// ============================================
// TYPES
// ============================================
export interface CinetPayLoginResponse {
  code: number;
  status: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CinetPayPaymentRequest {
  amount: number;
  currency: string;
  merchant_transaction_id: string;
  lang: string;
  designation: string;
  client_email: string;
  client_first_name: string;
  client_last_name: string;
  client_phone_number?: string;
  success_url: string;
  failed_url: string;
  notify_url: string;
  direct_pay?: boolean;
}

export interface CinetPayPaymentResponse {
  code: number;
  status: string;
  merchant_transaction_id: string;
  notify_token: string;
  transaction_id: string;
  payment_token: string;
  payment_url: string;
  details: {
    code: number;
    status: string; // 'INITIATED' | 'SUCCESS' | 'FAILED' | 'PENDING'
    message: string;
    must_be_redirected: boolean;
  };
}

export interface CinetPayVerifyResponse {
  code: number;
  status: string;
  data?: {
    merchant_transaction_id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    status: string; // 'SUCCESS' | 'FAILED' | 'PENDING' | 'WAITING'
    payment_method?: string;
    operator_transaction_id?: string;
    client_email?: string;
    client_first_name?: string;
    client_last_name?: string;
    client_phone_number?: string;
    created_at?: string;
    completed_at?: string;
  };
  message?: string;
}

// ============================================
// 🔑 LOGIN & CACHE
// ============================================
export async function getCinetPayToken(): Promise<string> {
  // Si on a un token en cache et qu'il est encore valide (avec 5 min de marge)
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  // Sinon, faire un nouveau login
  try {
    const response = await fetch(`${CINETPAY_BASE_URL}/v1/oauth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        api_key: API_KEY,
        api_password: API_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ CinetPay login failed:", response.status, errorText);
      throw new Error(`CinetPay login failed: ${response.status}`);
    }

    const data: CinetPayLoginResponse = await response.json();

    if (data.code !== 200 || !data.access_token) {
      console.error("❌ CinetPay login response invalid:", data);
      throw new Error("CinetPay login response invalid");
    }

    // Cache le token (expires_in est en secondes)
    cachedToken = data.access_token;
    tokenExpiresAt = now + data.expires_in * 1000;

    return cachedToken;
  } catch (error) {
    console.error("❌ Erreur getCinetPayToken:", error);
    throw error;
  }
}

// ============================================
// 💳 CRÉER UN PAIEMENT
// ============================================
export async function createCinetPayPayment(
  params: CinetPayPaymentRequest
): Promise<CinetPayPaymentResponse> {
  try {
    const token = await getCinetPayToken();

    const response = await fetch(`${CINETPAY_BASE_URL}/v1/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data: CinetPayPaymentResponse = await response.json();

    if (!response.ok || data.code !== 200) {
      console.error("❌ CinetPay create payment failed:", data);
      throw new Error(
        data.details?.message ||
        `CinetPay payment creation failed: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("❌ Erreur createCinetPayPayment:", error);
    throw error;
  }
}

// ============================================
// 🔍 VÉRIFIER UN PAIEMENT (source de vérité)
// ============================================
export async function verifyCinetPayPayment(
  merchantTransactionId: string
): Promise<CinetPayVerifyResponse> {
  try {
    const token = await getCinetPayToken();

    const response = await fetch(
      `${CINETPAY_BASE_URL}/v1/payment/${merchantTransactionId}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const data: CinetPayVerifyResponse = await response.json();

    if (!response.ok) {
      console.error("❌ CinetPay verify failed:", data);
      throw new Error(`CinetPay verify failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Erreur verifyCinetPayPayment:", error);
    throw error;
  }
}

// ============================================
// 🛠️ HELPERS UTILITAIRES
// ============================================

/**
 * Génère un merchant_transaction_id unique
 * Format: LL_[TIMESTAMP]_[RANDOM] (max 30 caractères)
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
    success_url: `${SITE_URL}/premium/success?tx=${merchantTransactionId}`,
    failed_url: `${SITE_URL}/premium/failed?tx=${merchantTransactionId}`,
    notify_url: `${SITE_URL}/api/payment/webhook`,
  };
}

// ============================================
// 💰 TARIFS PREMIUM (Option B)
// ============================================
export const PREMIUM_PRICING = {
  premium: {
    monthly: 2500,   // 2 500 FCFA/mois
    yearly: 21000,   // 21 000 FCFA/an (soit 1 750/mois, -30%)
  },
  gold: {
    monthly: 5000,   // 5 000 FCFA/mois
    yearly: 42000,   // 42 000 FCFA/an (soit 3 500/mois, -30%)
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
 * Calcule la date d'expiration à partir de aujourd'hui
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
 * Retourne un libellé pour la désignation CinetPay
 */
export function getPaymentDesignation(plan: PremiumPlan, period: BillingPeriod): string {
  const planLabel = plan === "premium" ? "Premium" : "Gold";
  const periodLabel = period === "monthly" ? "1 mois" : "1 an";
  return `LoveLink ${planLabel} - ${periodLabel}`;
}
