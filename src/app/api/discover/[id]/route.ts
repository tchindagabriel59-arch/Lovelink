import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer le profil
    const [profile] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        birthDate: users.birthDate,
        bio: users.bio,
        city: users.city,
        country: users.country,
        photoUrl: users.photoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        interests: users.interests,
        occupation: users.occupation,
        isOnline: users.isOnline,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        latitude: users.latitude,
        longitude: users.longitude,
        prompt1Question: users.prompt1Question,
        prompt1Answer: users.prompt1Answer,
        prompt2Question: users.prompt2Question,
        prompt2Answer: users.prompt2Answer,
        prompt3Question: users.prompt3Question,
        prompt3Answer: users.prompt3Answer,
      })
      .from(users)
      .where(eq(users.id, profileId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Calculer la distance
    const [currentUser] = await db
      .select({ latitude: users.latitude, longitude: users.longitude })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let distance: number | null = null;
    if (
      currentUser?.latitude != null &&
      currentUser?.longitude != null &&
      profile.latitude != null &&
      profile.longitude != null
    ) {
      distance = Math.round(
        calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          profile.latitude,
          profile.longitude
        )
      );
    }

    return NextResponse.json({
      profile: { ...profile, distance },
    });
  } catch (error) {
    console.error("Erreur GET profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
