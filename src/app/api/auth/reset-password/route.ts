
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
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...syntheticEmails.map(email => eq(users.email, email))));

    if (!foundUsers || foundUsers.length === 0) {
      return NextResponse.json({ error: "Compte non trouvé." }, { status: 400 });
    }

    let targetUser = null;

    for (const u of foundUsers) {
      if (!u.passwordHash) continue;
      
      // Test direct du code tel qu'envoyé (Lk-...)
      const isMatch = await bcrypt.compare(cleanCode, u.passwordHash);
      if (isMatch) {
        targetUser = u;
        break;
      }
      
      // Test fallback si jamais l'utilisateur a oublié le "Lk-"
      if (cleanCode.startsWith("Lk-")) {
        const isMatch2 = await bcrypt.compare(cleanCode.replace("Lk-", ""), u.passwordHash);
        if (isMatch2) { targetUser = u; break; }
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Code secret incorrect." }, { status: 400 });
    }

    // Hash du nouveau mot de passe définitif
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);
    await db.update(users).set({ passwordHash: hashedNewPassword }).where(eq(users.id, targetUser.id));

    return NextResponse.json({ success: true, message: "Réinitialisé !" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
