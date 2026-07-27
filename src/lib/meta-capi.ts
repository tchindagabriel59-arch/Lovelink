import crypto from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID!;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN!;
const API_VERSION = 'v21.0';

// Fonction pour hasher les données personnelles (obligatoire par Meta)
function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

interface CustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
}

interface SendEventParams {
  eventName: string;
  eventId: string; // Pour déduplication avec le Pixel
  eventSourceUrl?: string;
  userData: UserData;
  customData?: CustomData;
}

export async function sendMetaEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData,
  customData,
}: SendEventParams) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[Meta CAPI] Variables manquantes, événement non envoyé');
    return null;
  }

  try {
    // Construire user_data avec hachage SHA256
    const user_data: Record<string, string | string[]> = {};

    if (userData.email) user_data.em = hashData(userData.email);
    if (userData.phone) {
      // Nettoyer le numéro (garder que les chiffres)
      const cleanPhone = userData.phone.replace(/\D/g, '');
      user_data.ph = hashData(cleanPhone);
    }
    if (userData.firstName) user_data.fn = hashData(userData.firstName);
    if (userData.lastName) user_data.ln = hashData(userData.lastName);
    if (userData.city) user_data.ct = hashData(userData.city);
    if (userData.country) user_data.country = hashData(userData.country);
    if (userData.clientIpAddress) user_data.client_ip_address = userData.clientIpAddress;
    if (userData.clientUserAgent) user_data.client_user_agent = userData.clientUserAgent;
    if (userData.fbc) user_data.fbc = userData.fbc;
    if (userData.fbp) user_data.fbp = userData.fbp;

    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: eventSourceUrl,
      action_source: 'website',
      user_data,
      custom_data: customData || {},
    };

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData],
          access_token: ACCESS_TOKEN,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] Erreur:', result);
      return null;
    }

    console.log(`[Meta CAPI] ✅ Événement "${eventName}" envoyé:`, result);
    return result;
  } catch (error) {
    console.error('[Meta CAPI] Exception:', error);
    return null;
  }
}

// Fonction utilitaire pour extraire l'IP du client
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return undefined;
}

// Fonction pour générer un event ID unique (pour déduplication)
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
