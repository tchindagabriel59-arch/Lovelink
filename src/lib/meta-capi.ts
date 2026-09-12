import crypto from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID!;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN!;
const API_VERSION = 'v21.0';

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
  gender?: string;
  birthDate?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
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
  eventId: string;
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
    const user_data: Record<string, string | string[]> = {};

    // Email
    if (userData.email && !userData.email.includes('@phone.lovelink237.com')) {
      user_data.em = hashData(userData.email);
    }

    // Phone (Nettoyé, uniquement chiffres)
    if (userData.phone) {
      const cleanPhone = userData.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 8) {
        user_data.ph = hashData(cleanPhone);
      }
    }

    // First Name / Last Name
    if (userData.firstName) user_data.fn = hashData(userData.firstName);
    if (userData.lastName) user_data.ln = hashData(userData.lastName);

    // City
    if (userData.city) {
      const cleanCity = userData.city.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanCity) user_data.ct = hashData(cleanCity);
    }

    // Country (Code 2 lettres ISO e.g., 'sn' ou 'cm')
    if (userData.country) user_data.country = hashData(userData.country.toLowerCase());

    // Gender ('m' ou 'f')
    if (userData.gender) {
      const g = userData.gender.toLowerCase();
      const metaGender = g === 'male' || g === 'homme' || g === 'm' ? 'm' : g === 'female' || g === 'femme' || g === 'f' ? 'f' : undefined;
      if (metaGender) user_data.ge = hashData(metaGender);
    }

    // Date of Birth (Format YYYYMMDD selon norme Meta)
    if (userData.birthDate) {
      const cleanDob = userData.birthDate.replace(/\D/g, ''); // YYYYMMDD
      if (cleanDob.length === 8) user_data.db = hashData(cleanDob);
    }

    // Technical IDs
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

    console.log(`[Meta CAPI] ✅ Événement "${eventName}" envoyé avec succès:`, result);
    return result;
  } catch (error) {
    console.error('[Meta CAPI] Exception:', error);
    return null;
  }
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return undefined;
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
