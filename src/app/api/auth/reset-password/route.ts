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

    // 1. Nettoyage strict des entrées
    const cleanPhone = String(phone || "").trim();
    const cleanCode = String(code || "").trim(); // Le code saisi (ex: Lk-6jSMJuVX)
    const cleanNewPass = String(newPassword || "").trim();

    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json({ error: "Numéro WhatsApp invalide." }, { status: 400 });
    }
    if (!cleanCode || cleanCode.length < 4) {
      return NextResponse.json({ error: "Code secret invalide." }, { status: 400 });
    }
    if (cleanNewPass.length < 6) {
      return NextResponse.json({ error: "Le nouveau mot de passe est trop court." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(cleanPhone);
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    // 2. Trouver l'utilisateur
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(5);

    if (!foundUsers || foundUsers.length === 0) {
      return NextResponse.json({ error: "Aucun compte trouvé pour ce numéro." }, { status: 400 });
    }

    let targetUser = null;

    // 3. Comparaison ultra-robuste
    for (const u of foundUsers) {
      if (!u.passwordHash) continue;

      // On nettoie le hash de la BDD au cas où il y aurait des espaces
      const dbHash = u.passwordHash.trim();

      // Test du code tel quel
      let match = await bcrypt.compare(cleanCode, dbHash);

      // Si ça échoue, on teste sans le "Lk-" (si jamais l'admin a hashé sans le préfixe)
      if (!match && cleanCode.startsWith("Lk-")) {
        match = await bcrypt.compare(cleanCode.replace("Lk-", ""), dbHash);
      }
      
      // Si ça échoue encore, on teste tout en minuscules
      if (!match) {
        match = await bcrypt.compare(cleanCode.toLowerCase(), dbHash);
      }

      if (match) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.error(`[Reset-Password] ÉCHEC : Le code "${cleanCode}" ne match pas le hash en BDD pour l'ID ${foundUsers[0].id}`);
      return NextResponse.json(
        { error: "Code secret incorrect. Vérifie bien le code envoyé par l'admin." },
        { status: 400 }
      );
    }

    // 4. Hash du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, salt);

    // 5. Mise à jour finale
    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] SUCCÈS pour l'ID ${targetUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé ! Connecte-toi maintenant.",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur critique:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
