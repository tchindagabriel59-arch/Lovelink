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

    const normalizedPhone = normalizePhoneNumber(cleanPhone);
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    // 1. On cherche TOUS les comptes liés à ce numéro
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const allMatchingUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions));

    if (!allMatchingUsers || allMatchingUsers.length === 0) {
      return NextResponse.json({ error: "Aucun compte trouvé." }, { status: 400 });
    }

    let targetUser = null;

    // 2. On teste le code sur chaque compte trouvé
    for (const u of allMatchingUsers) {
      if (!u.passwordHash) continue;

      // Test Bcrypt
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(cleanCode, u.passwordHash);
      } catch (e) { isMatch = false; }

      // Test Texte Clair
      if (!isMatch && cleanCode === u.passwordHash) {
        isMatch = true;
      }

      if (isMatch) {
        targetUser = u;
        break;
      }
    }

    // 3. Si échec, on logue les détails pour que le Boss puisse vérifier
    if (!targetUser) {
      const details = allMatchingUsers.map(u => `ID:${u.id} (Email:${u.email?.split('@')[0]})`).join(", ");
      console.error(`[Reset-Password] ÉCHEC TOTAL | Code tenté: "${cleanCode}" | Comptes trouvés: ${details}`);
      
      return NextResponse.json(
        { error: "Code secret incorrect. Vérifie que tu as bien généré le code pour le bon compte dans l'admin." },
        { status: 400 }
      );
    }

    // 4. Si succès, on met à jour le compte qui a matché
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);
    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] ✅ SUCCÈS pour l'ID ${targetUser.id} (${targetUser.email})`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès !",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur critique:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
