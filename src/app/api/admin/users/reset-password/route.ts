// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Force le runtime Node.js pour assurer la compatibilité de bcryptjs sur Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Lecture ultra-simple du JSON
    const body = await req.json();
    
    // On cherche l'ID : ton frontend envoie probablement { "userId": ... }
    const userId = Number(body.userId || body.id);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: "ID utilisateur non reçu" 
      }, { status: 200 });
    }

    // 2. Génération d'un code simple (8 lettres/chiffres)
    const code = Math.random().toString(36).slice(-8).toUpperCase();
    const temporaryPassword = `Lk-${code}`;

    // 3. Hachage
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // 4. Mise à jour Neon
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    console.log(`[ADMIN] Password reset OK pour ID ${userId}: ${temporaryPassword}`);

    // 5. Réponse JSON pure et simple
    return NextResponse.json({
      success: true,
      temporaryPassword: temporaryPassword,
      password: temporaryPassword // au cas où le front cherche cette clé
    });

  } catch (error: any) {
    console.error("[ADMIN] Erreur fatale:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur interne" 
    }, { status: 200 });
  }
}
