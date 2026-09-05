import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs"; // important: bcryptjs (pas bcrypt)
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const codeHash = crypto.createHash("sha256").update(String(token)).digest("hex");

    const activeTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.codeHash, codeHash),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (activeTokens.length === 0) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou a expiré." },
        { status: 400 }
      );
    }

    const resetTokenRecord = activeTokens[0];
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetTokenRecord.userId));

    // Marquer le token comme utilisé (one-time)
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetTokenRecord.id));

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a bien été modifié.",
    });
  } catch (error) {
    console.error("Reset password execution error:", error);
    return NextResponse.json(
      { error: "Impossible de modifier le mot de passe." },
      { status: 500 }
    );
  }
}
