import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, birthDate } = await request.json();

    if (!email || !birthDate) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const formattedBirthDate = String(birthDate).trim(); // YYYY-MM-DD

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "Aucun compte ne correspond à cet e-mail." },
        { status: 404 }
      );
    }

    const user = existingUsers[0];

    // birthDate est un varchar(10) dans ton schéma
    if (!user.birthDate || user.birthDate !== formattedBirthDate) {
      return NextResponse.json(
        { error: "Les informations fournies ne correspondent pas." },
        { status: 400 }
      );
    }

    // Token brut (envoyé dans l'URL) + hash stocké en BDD (colonne codeHash)
    const token = crypto.randomBytes(32).toString("hex");
    const codeHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalider les anciens tokens non utilisés de cet user (propre)
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt)
        )
      );

    // Insertion compatible avec TON schéma exact
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      codeHash, // ← colonne réelle
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Identité vérifiée avec succès !",
      redirectUrl: `/reset-password?token=${token}`,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
