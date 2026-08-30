import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens, pushSubscriptions } from "@/db/schema";
import { eq, or, and, gt, isNull, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

function normalizeIdentifier(raw: string) {
  const input = raw.trim();
  const cleanInput = input.toLowerCase();
  const cleanDigits = input.replace(/[\s\-\+\(\)]/g, "");
  const cleanNo237 = cleanDigits.replace(/^237/, "");
  return {
    cleanInput,
    cleanDigits,
    phoneEmails: [
      `phone_${cleanDigits}@phone.lovelink237.com`,
      `phone_${cleanNo237}@phone.lovelink237.com`,
      `phone_237${cleanNo237}@phone.lovelink237.com`,
    ],
  };
}

function isRealEmail(email: string) {
  return (
    email.includes("@") &&
    !email.endsWith("@phone.lovelink237.com")
  );
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
}

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    if (!identifier || String(identifier).trim().length < 3) {
      return NextResponse.json(
        { error: "Indique ton email ou ton numéro WhatsApp" },
        { status: 400 }
      );
    }

    const { cleanInput, phoneEmails } = normalizeIdentifier(String(identifier));

    // Toujours répondre pareil (anti-énumération des comptes)
    const genericOk = {
      success: true,
      message:
        "Si un compte existe, un code de réinitialisation a été envoyé. Vérifie tes emails, SMS/WhatsApp ou tes notifications.",
    };

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        isBanned: users.isBanned,
      })
      .from(users)
      .where(
        or(
          eq(users.email, cleanInput),
          eq(users.email, phoneEmails[0]),
          eq(users.email, phoneEmails[1]),
          eq(users.email, phoneEmails[2])
        )
      )
      .limit(1);

    if (!user || user.isBanned) {
      return NextResponse.json(genericOk);
    }

    // Rate limit : max 3 codes / 30 min
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          gt(passwordResetTokens.createdAt, since)
        )
      );

    if (recent.length >= 3) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans 30 minutes." },
        { status: 429 }
      );
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      codeHash,
      expiresAt,
    });

    let sentBy: string[] = [];

    // 1) Email réel via Resend
    if (isRealEmail(user.email) && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from:
            process.env.RESEND_FROM ||
            "LoveLink <onboarding@resend.dev>",
          to: user.email,
          subject: "Code de réinitialisation LoveLink",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2>Salut ${user.firstName} 👋</h2>
              <p>Voici ton code pour réinitialiser ton mot de passe :</p>
              <p style="font-size:32px;font-weight:900;letter-spacing:8px;color:#e11d48">${code}</p>
              <p>Valable <strong>15 minutes</strong>.</p>
              <p>Si tu n'as pas demandé ce code, ignore ce message.</p>
              <p style="color:#64748b;font-size:12px">— LoveLink 💕</p>
            </div>
          `,
        });
        sentBy.push("email");
      } catch (e) {
        console.error("Resend error:", e);
      }
    }

    // 2) Push PWA si abonné
    try {
      const subs = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, user.id))
        .limit(1);

      if (subs.length > 0) {
        await sendPushToUser(user.id, {
          title: "🔑 Code LoveLink",
          body: `Ton code de réinitialisation : ${code} (15 min)`,
          tag: "password_reset",
          url: "/reset-password",
        });
        sentBy.push("push");
      }
    } catch (e) {
      console.error("Push reset error:", e);
    }

    // Log serveur (jamais renvoyer le code au client en prod)
    console.log(
      `[RESET] user=${user.id} sentVia=${sentBy.join(",") || "none"}`
    );

    // En dev uniquement, aide au debug :
    const payload: Record<string, unknown> = { ...genericOk };
    if (process.env.NODE_ENV !== "production") {
      payload.debugCode = code;
      payload.sentBy = sentBy;
    }

    // Indice UX sans spoiler le compte
    if (sentBy.includes("email")) {
      payload.hint = "email";
    } else if (sentBy.includes("push")) {
      payload.hint = "push";
    } else if (!isRealEmail(user.email)) {
      payload.hint = "phone_no_channel";
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
