import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { whatsappNumber, birthDate } = await request.json();

    if (!whatsappNumber || !birthDate) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs." },
        { status: 400 }
      );
    }

    // Nettoyage du numéro de téléphone
    const cleanPhone = whatsappNumber.replace(/\D/g, "");

    // Récupérer les utilisateurs (compatible peu importe le nom de la colonne dans schema.ts)
    const allUsers = await db.select().from(users);

    // Filtrage souple sur le numéro WhatsApp / téléphone
    const user = allUsers.find((u: any) => {
      const userPhone = (u.whatsappNumber || u.whatsapp || u.phone || u.phoneNumber || "").replace(/\D/g, "");
      return userPhone.includes(cleanPhone) || cleanPhone.includes(userPhone);
    });

    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte ne correspond à ce numéro." },
        { status: 404 }
      );
    }

    // Vérification de la date de naissance si renseignée
    const formattedInputBirthDate = new Date(birthDate).toISOString().split("T")[0];
    const userDbBirthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().split("T")[0]
      : null;

    if (userDbBirthDate && userDbBirthDate !== formattedInputBirthDate) {
      return NextResponse.json(
        { error: "La date de naissance ne correspond pas à ce compte." },
        { status: 400 }
      );
    }

    // Génération d'un token sécurisé (valide 15 mins)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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
