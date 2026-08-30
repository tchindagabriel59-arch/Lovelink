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
        { error: "Veuillez entrer le code secret reçu sur WhatsApp." },
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

    // 1. Trouver les utilisateurs potentiels correspondant au numéro
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(5);

    if (!foundUsers || foundUsers.length === 0) {
      console.warn(`[Reset-Password] Aucun compte trouvé pour phone=${normalizedPhone}`);
      return NextResponse.json(
        { error: "Aucun compte trouvé avec ce numéro WhatsApp." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let targetUser = null;

    // 2. Tester le code (avec gestion de la casse et des espaces)
    for (const u of foundUsers) {
      if (!u.passwordHash) continue;

      // Test 1: Code exact
      let isValid = await bcrypt.compare(cleanCode, u.passwordHash);

      // Test 2: En minuscules (ex: lk-12345678)
      if (!isValid) {
        isValid = await bcrypt.compare(cleanCode.toLowerCase(), u.passwordHash);
      }

      // Test 3: En majuscules
      if (!isValid) {
        isValid = await bcrypt.compare(cleanCode.toUpperCase(), u.passwordHash);
      }

      if (isValid) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.warn(
        `[Reset-Password] Code invalide (${cleanCode}) pour phone=${normalizedPhone}. User IDs testés: ${foundUsers.map(u => u.id).join(", ")}`
      );
      return NextResponse.json(
        { error: "Code secret incorrect. Vérifie le code envoyé par l'administrateur sur WhatsApp." },
        { status: 400 }
      );
    }

    // 3. Hash du NOUVEAU mot de passe choisi par l'utilisateur
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Mettre à jour le mot de passe dans Neon
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] Succès ! Mot de passe réinitialisé pour l'user ID ${targetUser.id} (${normalizedPhone})`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès !",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
