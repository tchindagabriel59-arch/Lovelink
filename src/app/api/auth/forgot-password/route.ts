// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, or, and, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  normalizePhoneNumber,
  phoneToSyntheticEmails,
  sendWhatsAppResetCode,
} from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Veuillez entrer un numéro WhatsApp valide." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone.trim());
    const syntheticEmails = phoneToSyntheticEmails(normalizedPhone);

    // 1. Recherche de l'utilisateur via ses emails synthétiques possibles dans users.email
    const emailConditions = syntheticEmails.map((email) => eq(users.email, email));

    const foundUsers = await db
      .select()
      .from(users)
      .where(or(...emailConditions))
      .limit(1);

    const user = foundUsers[0];

    // Pour la sécurité, réponse neutre si non trouvé
    if (!user) {
      console.warn(`[Forgot-Password] Aucun compte trouvé pour: ${normalizedPhone}`);
      return NextResponse.json({
        success: true,
        message: "Si ce numéro existe, un code a été envoyé sur WhatsApp.",
        phone: normalizedPhone,
      });
    }

    // 2. Rate limiting : Max 3 demandes / 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentTokensCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          gt(passwordResetTokens.createdAt, thirtyMinAgo)
        )
      );

    const count = Number(recentTokensCount[0]?.count || 0);
    if (count >= 3) {
      return NextResponse.json(
        {
          error:
            "Trop de tentatives. Veuillez patienter 30 minutes avant de demander un nouveau code.",
        },
        { status: 429 }
      );
    }

    // 3. Génération du code à 6 chiffres
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // 4. Invalider les anciens codes non utilisés
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          sql`${passwordResetTokens.usedAt} IS NULL`
        )
      );

    // 5. Sauvegarder le token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      codeHash,
      expiresAt,
    });

    // 6. Envoi WhatsApp
    const sendResult = await sendWhatsAppResetCode(normalizedPhone, rawCode);

    if (!sendResult.success) {
      console.error("[Forgot-Password] Erreur envoi WhatsApp:", sendResult.error);
      return NextResponse.json(
        {
          error:
            "Impossible d'envoyer le message WhatsApp. Vérifie ton numéro ou réessaie plus tard.",
        },
        { status: 500 }
      );
    }

    console.log(`[Forgot-Password] Code envoyé à ${normalizedPhone} (User ID: ${user.id})`);

    return NextResponse.json({
      success: true,
      message: "Code envoyé avec succès par WhatsApp !",
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error("[Forgot-Password] Erreur serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande." },
      { status: 500 }
    );
  }
}
