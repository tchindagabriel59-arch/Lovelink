import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lovelink-super-secret-key-2024-change-me"
);

export async function createToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
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

export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  // 🚫 Vérifier si l'utilisateur est banni
  const [user] = await db
    .select({ isBanned: users.isBanned })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user || user.isBanned) return null;

  return payload.userId;
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
