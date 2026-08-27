import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getCurrentUserId } from "@/lib/auth";

/** Génère un mot de passe simple à dicter sur WhatsApp (sans caractères ambigus) */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Lk-${code}`; // ex: Lk-a7K3mN9p
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();

    // ✅ Force number (évite le bug string vs number → 0 row updated)
    const targetUserId = Number(body.targetUserId);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "Utilisateur invalide" }, { status: 400 });
    }

    // Vérifie que l'user existe
    const [target] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // ✅ Génère auto (ou utilise celui fourni si tu en envoies un)
    const plainPassword =
      typeof body.newPassword === "string" && body.newPassword.trim().length >= 4
        ? body.newPassword.trim()
        : generateTempPassword();

    // Hash bcrypt (même lib que le login)
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    // Double-check local : le hash doit matcher
    const selfCheck = await bcrypt.compare(plainPassword, passwordHash);
    if (!selfCheck) {
      return NextResponse.json(
        { error: "Erreur de hash interne" },
        { status: 500 }
      );
    }

    // ✅ Update STRICT sur l'id numérique
    const updated = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId))
      .returning({ id: users.id, passwordHash: users.passwordHash });

    if (!updated.length) {
      return NextResponse.json(
        { error: "Aucune ligne mise à jour" },
        { status: 500 }
      );
    }

    // ✅ Vérifie EN BDD que le nouveau hash fonctionne
    const dbCheck = await bcrypt.compare(plainPassword, updated[0].passwordHash);
    if (!dbCheck) {
      return NextResponse.json(
        { error: "Le mot de passe n'a pas été enregistré correctement" },
        { status: 500 }
      );
    }

    // Numéro WhatsApp si email synthétique phone_...
    let phoneHint: string | null = null;
    const m = target.email?.match(/^phone_(\d+)@phone\.lovelink237\.com$/i);
    if (m) phoneHint = m[1];

    return NextResponse.json({
      success: true,
      temporaryPassword: plainPassword, // ⚠️ à copier une seule fois
      user: {
        id: target.id,
        firstName: target.firstName,
        lastName: target.lastName,
        email: target.email,
        phone: phoneHint,
      },
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
