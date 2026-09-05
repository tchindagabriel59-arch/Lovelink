import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema"; // Ajuste le chemin selon ton schéma
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// Table des tokens de réinitialisation (déjà existante dans ton schéma)
import { passwordResetTokens } from "@/db/schema"; 

export async function POST(request: Request) {
  try {
    const { whatsappNumber, birthDate } = await request.json();

    if (!whatsappNumber || !birthDate) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs." },
        { status: 400 }
      );
    }

    // Nettoyage du numéro de téléphone (garder uniquement les chiffres)
    const cleanPhone = whatsappNumber.replace(/\D/g, "");

    // Recherche de l'utilisateur avec ce numéro ET cette date de naissance
    // Note : Adapte les noms des colonnes (ex: users.phone ou users.whatsapp, users.birthDate)
    const formattedBirthDate = new Date(birthDate).toISOString().split('T')[0];

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.phone, cleanPhone)); // ou users.whatsapp selon ton schéma

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "Aucun compte ne correspond à ce numéro." },
        { status: 404 }
      );
    }

    const user = existingUsers[0];

    // Vérification de la date de naissance
    const userDbBirthDate = user.birthDate 
      ? new Date(user.birthDate).toISOString().split('T')[0] 
      : null;

    if (!userDbBirthDate || userDbBirthDate !== formattedBirthDate) {
      return NextResponse.json(
        { error: "Les informations fournies ne correspondent pas." },
        { status: 400 }
      );
    }

    // Génération d'un token sécurisé à usage unique
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 minutes

    // Insertion du token en BDD
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: token,
      expiresAt: expiresAt,
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
