import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { identifier, birthDate } = await request.json();

    if (!identifier || !birthDate) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs." },
        { status: 400 }
      );
    }

    const cleanInput = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanInput.replace(/\D/g, "");
    const formattedBirthDate = String(birthDate).trim();

    // Récupération de tous les utilisateurs pour recherche flexible (Email ou Téléphone stocké dans email)
    const allUsers = await db.select().from(users);

    const user = allUsers.find((u) => {
      const userEmail = u.email ? u.email.toLowerCase() : "";
      const userDigits = userEmail.replace(/\D/g, "");

      // Match par E-mail direct
      if (userEmail === cleanInput) return true;

      // Match par numéro de téléphone (si l'user a entré son numéro)
      if (cleanDigits.length >= 6 && userDigits.includes(cleanDigits)) return true;

      return false;
    });

    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte ne correspond à cet identifiant (Numéro ou Email)." },
        { status: 404 }
      );
    }

    // Vérification de la date de naissance (format string YYYY-MM-DD)
    if (!user.birthDate || user.birthDate !== formattedBirthDate) {
      return NextResponse.json(
        { error: "La date de naissance ne correspond pas." },
        { status: 400 }
      );
    }

    // Token brut pour l'URL et hash SHA256 pour BDD (colonne codeHash)
    const token = crypto.randomBytes(32).toString("hex");
    const codeHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expiration 15 mins

    // Nettoyage des anciens tokens inutilisés
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt)
        )
      );

    // Insertion compatible avec ton schéma exact (userId, codeHash, expiresAt)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      codeHash: codeHash,
      expiresAt: expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Identité vérifiée !",
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
