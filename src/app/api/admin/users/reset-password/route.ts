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
    
    // On vérifie juste si l'utilisateur est connecté (le dossier /admin est déjà protégé)
    if (!adminUser) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const userId = Number(body.userId || body.id);

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur manquant." }, { status: 400 });
    }

    // Génération d'un code lisible de 8 caractères
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const temporaryPassword = `Lk-${randomCode}`;
    
    // TRÈS IMPORTANT : On utilise 10 rounds pour bcrypt
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Mise à jour en BDD
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    console.log(`[Admin-Reset] Mot de passe généré pour user ${userId} : ${temporaryPassword}`);

    return NextResponse.json({
      success: true,
      password: temporaryPassword,
      temporaryPassword,
      message: `Mot de passe temporaire : ${temporaryPassword}`,
    });
  } catch (error) {
    console.error("[Admin-Reset] Erreur serveur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
