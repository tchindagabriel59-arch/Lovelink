import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lovelink-super-secret-key-2024-change-me"
);

export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function createToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d")
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

// ⚡ VERSION RAPIDE SÉCURISÉE
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

// ⚡ CHECK BANNI SÉCURISÉ
export async function getCurrentUserIdWithBanCheck(): Promise<number | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const [user] = await db
      .select({ isBanned: users.isBanned })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.isBanned) return null;
    return userId;
  } catch {
    return null;
  }
}

// 🔄 GET CURRENT USER BLINDÉ
export async function getCurrentUser() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.isBanned) return null;

    // Auto-cleanup sans bloquer si la BDD est lente
    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) < new Date()
    ) {
      try {
        await db
          .update(users)
          .set({ isPremium: false })
          .where(eq(users.id, user.id));
      } catch (e) {
        console.error("Cleanup premium error:", e);
      }
      user.isPremium = false;
    }

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

// Vérifier si l'utilisateur actuel est admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const [user] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.isAdmin === true;
  } catch {
    return false;
  }
}

// Récupérer l'utilisateur admin actuel
export async function getCurrentAdmin() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.isAdmin) return null;
    return user;
  } catch {
    return null;
  }
}
