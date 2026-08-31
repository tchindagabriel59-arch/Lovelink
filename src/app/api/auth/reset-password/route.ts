// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, or, and, gt, isNull, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  normalizePhoneNumber,
  phoneToSyntheticEmails,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanCode = String(body.code || "").trim();
    const cleanNewPass = String(body.newPassword || "").trim();
    const rawPhone = String(body.phone || "").trim();

    if (!cleanCode || cleanCode.length < 4) {
      return NextResponse.json(
        { error: "Saisis le code reçu (ex: Lk-XXXXXXXX)." },
        { status: 400 }
      );
    }
    if (cleanNewPass.length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 6 caractères." },
        { status: 400 }
      );
    }

    let targetUserId: number | null = null;

    // ========== STRATÉGIE A : tokens récents (la bonne) ==========
    try {
      const tokens = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.usedAt)
          )
        )
        .orderBy(desc(passwordResetTokens.createdAt))
        .limit(50);

      for (const t of tokens) {
        const ok = await bcrypt.compare(cleanCode, t.codeHash);
        if (ok) {
          targetUserId = t.userId;
          // marque utilisé
          await db
            .update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, t.id));
          break;
        }
      }
    } catch (e) {
      console.warn("[Reset-Password] tokens lookup skip:", e);
    }

    // ========== STRATÉGIE B : par numéro WhatsApp ==========
    if (!targetUserId && rawPhone) {
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      const emails = phoneToSyntheticEmails(normalizedPhone);

      const phoneUsers = await db
        .select()
        .from(users)
        .where(or(...emails.map((e) => eq(users.email, e))))
        .limit(10);

      for (const u of phoneUsers) {
        if (!u.passwordHash) continue;
        if (await bcrypt.compare(cleanCode, u.passwordHash)) {
          targetUserId = u.id;
          break;
        }
      }
    }

    // ========== STRATÉGIE C : secours — users les plus récents ==========
    if (!targetUserId) {
      // ⚠️ important: order by id DESC pour prendre les comptes récents
      const recent = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .orderBy(desc(users.id))
        .limit(200);

      for (const u of recent) {
        if (!u.passwordHash) continue;
        if (await bcrypt.compare(cleanCode, u.passwordHash)) {
          targetUserId = u.id;
          break;
        }
      }
    }

    if (!targetUserId) {
      console.warn(`[Reset-Password] Code invalide: ${cleanCode}`);
      return NextResponse.json(
        {
          error:
            "Code secret incorrect. Vérifie le code Telegram/WhatsApp, ou régénère un nouveau code dans l'admin sur LE BON utilisateur.",
        },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(cleanNewPass, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, targetUserId));

    console.log(`[Reset-Password] ✅ OK user #${targetUserId}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé ! Tu peux te connecter.",
    });
  } catch (error) {
    console.error("[Reset-Password] FATAL:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
