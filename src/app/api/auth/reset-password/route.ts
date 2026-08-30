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

    const cleanPhone = String(phone || "").trim();
    const cleanCode = String(code || "").trim();
    const cleanNewPass = String(newPassword || "").trim();

    if (!cleanPhone || !cleanCode || cleanNewPass.length < 6) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(cleanPhone);
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(5);

    if (!foundUsers || foundUsers.length === 0) {
      return NextResponse.json({ error: "Compte non trouvé pour ce numéro." }, { status: 400 });
    }

    let targetUser = null;

    for (const u of foundUsers) {
      if (!u.passwordHash) continue;

      const dbHash = u.passwordHash.trim();

      // Test 1: Code complet (ex: Lk-ABC12345)
      let isMatch = await bcrypt.compare(cleanCode, dbHash);

      // Test 2: Sans le préfixe Lk-
      if (!isMatch && cleanCode.startsWith("Lk-")) {
        isMatch = await bcrypt.compare(cleanCode.replace("Lk-", ""), dbHash);
      }

      // Test 3: Casse tolérante
      if (!isMatch) {
        isMatch = await bcrypt.compare(cleanCode.toUpperCase(), dbHash);
      }

      if (isMatch) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.error(`[Reset-Password] Échec validation code "${cleanCode}" pour ID ${foundUsers[0].id}`);
      return NextResponse.json(
        { error: "Code secret incorrect. Génère un nouveau code depuis l'admin et réessaie." },
        { status: 400 }
      );
    }

    // Hash du nouveau mot de passe utilisateur
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);

    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] ✅ SUCCÈS pour l'user ID ${targetUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé ! Tu peux maintenant te connecter.",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur critique:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
