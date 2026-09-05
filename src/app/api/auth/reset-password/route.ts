import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // 1. Trouver le token valide et non expiré en base de données
    const activeTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date()) // Non expiré
        )
      );

    if (activeTokens.length === 0) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou a expiré." },
        { status: 400 }
      );
    }

    const resetTokenRecord = activeTokens[0];

    // 2. Hacher le nouveau mot de passe (10 rounds bcrypt)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 3. Mettre à jour l'utilisateur
    await db
      .update(users)
      .set({ passwordHash: passwordHash })
      .where(eq(users.id, resetTokenRecord.userId));

    // 4. Supprimer le token pour éviter qu'il ne soit réutilisé
    await db
      .delete(passwordResetTokens)
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
