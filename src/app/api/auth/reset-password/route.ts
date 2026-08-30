// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, or, and, gt, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  normalizePhoneNumber,
  phoneToSyntheticEmails,
} from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, newPassword } = body;

    // Validation des entrées
    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Numéro WhatsApp invalide." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "Le code doit comporter exactement 6 chiffres." },
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

    // 1. Trouver l'utilisateur
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      return NextResponse.json(
        { error: "Code ou numéro invalide." },
        { status: 400 }
      );
    }

    // 2. Récupérer le dernier token valide et non expiré pour cet user
    const now = new Date();
    const activeTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          gt(passwordResetTokens.expiresAt, now),
          sql`${passwordResetTokens.usedAt} IS NULL`
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);

    const activeToken = activeTokens[0];

    if (!activeToken) {
      return NextResponse.json(
        { error: "Code expiré ou invalide. Veuillez faire une nouvelle demande." },
        { status: 400 }
      );
    }

    // 3. Vérifier le code bcrypt
    const isCodeValid = await bcrypt.compare(code.trim(), activeToken.codeHash);

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Code incorrect. Vérifiez le message reçu sur WhatsApp." },
        { status: 400 }
      );
    }

    // 4. Hash du nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 5. Mettre à jour le mot de passe de l'utilisateur
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    // 6. Marquer le token comme utilisé
    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, activeToken.id));

    console.log(`[Reset-Password] Mot de passe réinitialisé pour l'user ID ${user.id} (${normalizedPhone})`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès ! Tu peux maintenant te connecter.",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
