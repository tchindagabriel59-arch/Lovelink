import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lovelink-super-secret-key-2024-change-me"
);

// ⚡ Durée de session style Farata : 1 AN (365 jours)
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function createToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d") // 👈 Valable 1 an
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number };
  } catch {
    return null;
  }
}

// ⚡ VERSION RAPIDE (0 requête SQL)
export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  return payload.userId;
}

// ⚡ VERSION AVEC CHECK BANNI
export async function getCurrentUserIdWithBanCheck(): Promise<number | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [user] = await db
    .select({ isBanned: users.isBanned })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.isBanned) return null;
  return userId;
}

// 🔄 👑 RÉCUPÉRER L'UTILISATEUR ACTUEL + AUTO-CLEANUP PREMIUM EXPIRÉ
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.isBanned) return null;

  // 🧹 Auto-nettoyage : Si le Premium est expiré, on remet isPremium à false en BDD !
  if (
    user.isPremium &&
    user.premiumExpiresAt &&
    new Date(user.premiumExpiresAt) < new Date()
  ) {
    await db
      .update(users)
      .set({ isPremium: false })
      .where(eq(users.id, user.id));

    user.isPremium = false; // Met à jour l'objet en mémoire
  }

  return user;
}

// Vérifier si l'utilisateur actuel est admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.isAdmin === true;
}

// Récupérer l'utilisateur admin actuel (ou null)
export async function getCurrentAdmin() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.isAdmin) return null;
  return user;
}
