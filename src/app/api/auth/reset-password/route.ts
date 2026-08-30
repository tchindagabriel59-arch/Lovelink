import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt, isNull, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function normalizeIdentifier(raw: string) {
  const input = raw.trim();
  const cleanInput = input.toLowerCase();
  const cleanDigits = input.replace(/[\s\-\+\(\)]/g, "");
  const cleanNo237 = cleanDigits.replace(/^237/, "");
  return {
    cleanInput,
    phoneEmails: [
      `phone_${cleanDigits}@phone.lovelink237.com`,
      `phone_${cleanNo237}@phone.lovelink237.com`,
      `phone_237${cleanNo237}@phone.lovelink237.com`,
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, code, newPassword } = await req.json();

    if (!identifier || !code || !newPassword) {
      return NextResponse.json(
        { error: "Identifiant, code et nouveau mot de passe requis" },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Mot de passe trop court (min. 6 caractères)" },
        { status: 400 }
      );
    }

    const { cleanInput, phoneEmails } = normalizeIdentifier(String(identifier));

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        eq(users.email, cleanInput) // on retente aussi les phones ci-dessous
      )
      .limit(1);

    // Recherche élargie
    let userId = user?.id;
    if (!userId) {
      for (const em of [cleanInput, ...phoneEmails]) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, em))
          .limit(1);
        if (u) {
          userId = u.id;
          break;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    const now = new Date();
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(5);

    let matched = null as (typeof tokens)[0] | null;
    for (const t of tokens) {
      const ok = await bcrypt.compare(String(code).trim(), t.codeHash);
      if (ok) {
        matched = t;
        break;
      }
    }

    if (!matched) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, matched.id));

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour. Tu peux te connecter.",
    });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
