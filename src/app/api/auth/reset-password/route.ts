// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { normalizePhoneNumber, phoneToSyntheticEmails } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, newPassword } = body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Numéro WhatsApp invalide." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length < 4) {
      return NextResponse.json(
        { error: "Veuillez entrer le code reçu sur WhatsApp." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 6 caractères." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone.trim());
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    // 1. Trouver l'utilisateur par son numéro
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte trouvé avec ce numéro WhatsApp." },
        { status: 400 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Erreur de compte. Contacte le support." },
        { status: 400 }
      );
    }

    // 2. Vérifier si le code entré correspond au mot de passe temporaire généré par l'admin
    const isCodeValid = await bcrypt.compare(code.trim(), user.passwordHash);

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Code secret incorrect. Vérifie le code envoyé par l'administrateur sur WhatsApp." },
        { status: 400 }
      );
    }

    // 3. Hash du NOUVEAU mot de passe choisi par l'utilisateur
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Mettre à jour la BDD
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    console.log(`[Reset-Password-Manual] Mot de passe réinitialisé pour l'user ID ${user.id} (${normalizedPhone})`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès !",
    });
  } catch (error) {
    console.error("[Reset-Password-Manual] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
