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

    const cleanCode = String(code || "").trim();
    const cleanNewPass = String(newPassword || "").trim();
    const normalizedPhone = normalizePhoneNumber(String(phone || "").trim());

    if (!cleanCode || cleanNewPass.length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 6 caractères." },
        { status: 400 }
      );
    }

    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...syntheticEmails.map((email) => eq(users.email, email))));

    if (!foundUsers || foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Aucun compte trouvé pour ce numéro WhatsApp." },
        { status: 400 }
      );
    }

    let targetUser = null;

    for (const u of foundUsers) {
      if (!u.passwordHash) continue;

      // Test 1: Code exact (ex: Lk-8X3K9M2P)
      let isMatch = await bcrypt.compare(cleanCode, u.passwordHash);

      // Test 2: Si l'user oublie ou modifie le préfixe
      if (!isMatch && cleanCode.startsWith("Lk-")) {
        isMatch = await bcrypt.compare(cleanCode.replace("Lk-", ""), u.passwordHash);
      }

      // Test 3: Casse majuscule/minuscule
      if (!isMatch) {
        isMatch = await bcrypt.compare(cleanCode.toUpperCase(), u.passwordHash);
      }

      if (isMatch) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.warn(`[Reset-Password] Code incorrect "${cleanCode}" pour phone ${normalizedPhone}`);
      return NextResponse.json(
        { error: "Code secret incorrect. Recopie le code envoyé par l'administrateur." },
        { status: 400 }
      );
    }

    // Enregistrement du NOUVEAU mot de passe choisi par le client
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);
    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] ✅ Mot de passe mis à jour avec succès pour User #${targetUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé ! Tu peux maintenant te connecter.",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
