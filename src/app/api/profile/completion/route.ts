// src/app/api/profile/completion/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { calculateProfileCompletion } from "@/lib/profile-completion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        photoUrl: users.photoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        bio: users.bio,
        city: users.city,
        country: users.country,
        occupation: users.occupation,
        interests: users.interests,
        birthDate: users.birthDate,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const completion = calculateProfileCompletion({
      photoUrl: user.photoUrl,
      photo1Url: user.photo1Url,
      photo2Url: user.photo2Url,
      photo3Url: user.photo3Url,
      photo4Url: user.photo4Url,
      bio: user.bio,
      city: user.city,
      country: user.country,
      occupation: user.occupation,
      interests: user.interests,
      birthDate: user.birthDate,
      isVerified: user.isVerified,
    });

    return NextResponse.json({
      success: true,
      ...completion,
    });
  } catch (error) {
    console.error("[Profile-Completion] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul du profil" },
      { status: 500 }
    );
  }
}
