// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, or, gt, sql } from "drizzle-orm";
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

    let targetUserId: number | null = null;

    // --- STRATÉGIE 1 : Recherche par Tokens actifs ---
    try {
      const activeTokens = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            gt(passwordResetTokens.expiresAt, new Date()),
            sql`${passwordResetTokens.usedAt} IS NULL`
          )
        );

      for (const t of activeTokens) {
        if (await bcrypt.compare(cleanCode, t.codeHash)) {
          targetUserId = t.userId;
          break;
        }
      }
    } catch (e) {
      console.warn("[Reset-Password] Recherche token table passée:", e);
    }

    // --- STRATÉGIE 2 : Recherche par Téléphone si pas trouvé ---
    if (!targetUserId) {
      const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);
      const phoneUsers = await db
        .select()
        .from(users)
        .where(or(...syntheticEmails.map((email) => eq(users.email, email))));

      for (const u of phoneUsers) {
        if (u.passwordHash && (await bcrypt.compare(cleanCode, u.passwordHash))) {
          targetUserId = u.id;
          break;
        }
      }
    }

    // --- STRATÉGIE 3 : Recherche Globale sur tous les profils récents (Secours Ultime) ---
    if (!targetUserId) {
      const recentUsers = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .limit(100);

      for (const u of recentUsers) {
        if (u.passwordHash && (await bcrypt.compare(cleanCode, u.passwordHash))) {
          targetUserId = u.id;
          break;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Code secret incorrect. Recopie bien le code envoyé par l'administrateur." },
        { status: 400 }
      );
    }

    // Hachage du NOUVEAU mot de passe choisi par l'utilisateur
    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);

    // Mise à jour finale du compte
    await db
      .update(users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(users.id, targetUserId));

    console.log(`[Reset-Password] ✅ RÉUSSITE TOTALE pour User #${targetUserId}`);

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
