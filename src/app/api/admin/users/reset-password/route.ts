// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUser();
    
    // Sécurité Admin
    if (!adminUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    console.log("DEBUG - Admin Reset Request Body:", body);

    // On accepte TOUTES les variantes possibles d'ID envoyées par le front
    const rawId = body.userId || body.id || body.user?.id || body.targetUserId;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "ID utilisateur manquant ou invalide." }, { status: 400 });
    }

    // Génération d'un code lisible (sans les caractères ambigus comme 0, O, I, 1, l)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const temporaryPassword = `Lk-${randomCode}`;
    
    // Hachage propre (10 rounds)
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Mise à jour Neon
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    console.log(`[Admin-Reset] ✅ Succès pour l'ID ${userId} : ${temporaryPassword}`);

    // On renvoie tous les formats de réponse possibles pour le front
    return NextResponse.json({
      success: true,
      password: temporaryPassword,
      temporaryPassword: temporaryPassword,
      newPassword: temporaryPassword,
      message: `Mot de passe généré : ${temporaryPassword}`,
    });
  } catch (error) {
    console.error("[Admin-Reset] Erreur critique:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
