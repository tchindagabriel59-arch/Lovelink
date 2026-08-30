// src/app/api/admin/users/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("--- DEBUG ADMIN RESET START ---");
  
  try {
    // 1. Essayer de lire le body peu importe le format
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    }
    
    console.log("Payload reçu:", JSON.stringify(body));

    // 2. Chercher l'ID partout (userId, id, targetId, etc.)
    const rawId = body.userId || body.id || body.targetUserId || body.targetId;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      console.error("ID invalide détecté:", rawId);
      return NextResponse.json({ 
        success: false, 
        error: "ID utilisateur manquant dans la requête." 
      }, { status: 200 }); // On renvoie 200 pour éviter l'erreur réseau
    }

    // 3. Générer le code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const tempPass = `Lk-${randomCode}`;
    
    console.log(`Hachage pour ID ${userId}...`);
    const hash = await bcrypt.hash(tempPass, 10);

    // 4. Update Neon
    await db
      .update(users)
      .set({ passwordHash: hash })
      .where(eq(users.id, userId));

    console.log(`✅ SUCCÈS : ${tempPass} pour ID ${userId}`);

    return NextResponse.json({
      success: true,
      ok: true,
      temporaryPassword: tempPass,
      password: tempPass,
      message: `Code généré : ${tempPass}`
    });

  } catch (err: any) {
    console.error("CRASH API ADMIN:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Crash serveur: " + err.message 
    }, { status: 200 }); // Toujours 200 pour que le front affiche l'erreur proprement
  }
}
