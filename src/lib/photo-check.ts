import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * 🔒 Vérifie si un utilisateur a une photo de profil
 * Retourne null si OK, ou une NextResponse d'erreur si pas de photo
 */
export async function requirePhoto(userId: number): Promise<NextResponse | null> {
  const user = await db
    .select({ photoUrl: users.photoUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const hasPhoto = user[0]?.photoUrl && user[0].photoUrl.trim() !== "";

  if (!hasPhoto) {
    return NextResponse.json(
      {
        error: "Ajoute une photo de profil pour utiliser cette fonctionnalité",
        code: "PHOTO_REQUIRED",
        redirectTo: "/welcome",
      },
      { status: 403 }
    );
  }

  return null; // OK, l'user a une photo
}
