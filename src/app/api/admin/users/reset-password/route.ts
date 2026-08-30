// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1. Récupération sécurisée du body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.warn("[Admin-Reset] Body JSON invalide ou vide:", e);
    }

    console.log("[Admin-Reset] Requête reçue:", JSON.stringify(body));

    // 2. Extraire le userId sous n'importe quelle forme envoyée par le frontend
    const rawId = body?.userId ?? body?.id ?? body?.targetUserId ?? body?.user?.id;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      console.error("[Admin-Reset] ID manquant ou invalide:", rawId);
      return NextResponse.json(
        { success: false, error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }

    // 3. Vérifier la présence de l'utilisateur dans Neon
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      console.error(`[Admin-Reset] User ID ${userId} introuvable en BDD.`);
      return NextResponse.json(
        { success: false, error: `Utilisateur #${userId} introuvable.` },
        { status: 404 }
      );
    }

    // 4. Générer le mot de passe temporaire (ex: Lk-8X3K9M2P)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const temporaryPassword = `Lk-${randomCode}`;

    // 5. Hachage bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // 6. Mise à jour dans Neon
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    console.log(`[Admin-Reset] ✅ Mot de passe généré pour User #${userId} : ${temporaryPassword}`);

    // 7. Réponse 200 universelle (toutes les clés possibles pour le frontend)
    return NextResponse.json({
      ok: true,
      success: true,
      password: temporaryPassword,
      temporaryPassword: temporaryPassword,
      message: temporaryPassword,
    });
  } catch (error) {
    console.error("[Admin-Reset] Erreur serveur critique:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors du reset." },
      { status: 500 }
    );
  }
}
