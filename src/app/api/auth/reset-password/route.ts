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
      return NextResponse.json({ error: "Compte non trouvé." }, { status: 400 });
    }

    let targetUser = null;

    for (const u of foundUsers) {
      if (!u.passwordHash) continue;

      const dbHash = u.passwordHash.trim();

      // --- TEST 1 : Comparaison Bcrypt classique ---
      let match = false;
      try {
        match = await bcrypt.compare(cleanCode, dbHash);
      } catch (e) {
        match = false;
      }

      // --- TEST 2 : Comparaison Texte Clair (Au cas où l'admin n'a pas haché) ---
      if (!match) {
        if (cleanCode === dbHash) {
          match = true;
          console.log("[Reset-Password] Match trouvé en Texte Clair !");
        }
      }

      // --- TEST 3 : Casse différente ---
      if (!match) {
        if (cleanCode.toLowerCase() === dbHash.toLowerCase()) {
          match = true;
        }
      }

      if (match) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.error(`[Reset-Password] ÉCHEC TOTAL pour le code "${cleanCode}" | ID ${foundUsers[0].id}`);
      return NextResponse.json(
        { error: "Code secret incorrect. Recopie-le bien sans espaces." },
        { status: 400 }
      );
    }

    // Une fois le code validé, on hache proprement le NOUVEAU mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, salt);

    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] RÉUSSITE pour l'ID ${targetUser.id}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé ! Tu peux maintenant te connecter.",
    });
  } catch (error) {
    console.error("[Reset-Password] Erreur critique:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
