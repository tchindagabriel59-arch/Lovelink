// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm"; // Ajout de 'and' ici
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

    // --- STRATÉGIE : RECHERCHE DIRECTE DANS LA TABLE USERS ---
    // Puisque l'admin vient de mettre à jour le passwordHash de l'user, 
    // le code secret (Lk-...) est actuellement le hash du compte.

    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);
    
    // On récupère tous les utilisateurs qui pourraient correspondre au numéro
    const matchingUsers = await db
      .select()
      .from(users)
      .where(or(...syntheticEmails.map((email) => eq(users.email, email))));

    let targetUser = null;

    // On teste le code sur chaque compte trouvé
    for (const u of matchingUsers) {
      if (!u.passwordHash) continue;

      // Vérification bcrypt du code envoyé par l'admin
      const isMatch = await bcrypt.compare(cleanCode, u.passwordHash);
      if (isMatch) {
        targetUser = u;
        break;
      }
    }

    // SI NON TROUVÉ PAR TÉLÉPHONE : Recherche large (au cas où le numéro saisi est différent)
    if (!targetUser) {
      // On prend les 50 derniers utilisateurs modifiés (pour la performance)
      const recentUsers = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .limit(100);

      for (const u of recentUsers) {
        if (u.passwordHash && (await bcrypt.compare(cleanCode, u.passwordHash))) {
          targetUser = u;
          break;
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Code secret incorrect. Recopie bien le code envoyé par l'administrateur." },
        { status: 400 }
      );
    }

    // Hachage du NOUVEAU mot de passe choisi par l'utilisateur
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);

    // Mise à jour finale du compte avec le vrai mot de passe
    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUser.id));

    console.log(`[Reset-Password] ✅ RÉUSSITE pour User #${targetUser.id}`);

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
