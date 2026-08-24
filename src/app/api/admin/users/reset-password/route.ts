import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!(admin as any)?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { targetUserId, newPassword } = await req.json();

    if (!targetUserId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "Mot de passe invalide (min. 4 caractères)" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() } as any)
      .where(eq(users.id, targetUserId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur lors du changement de mot de passe" }, { status: 500 });
  }
}
