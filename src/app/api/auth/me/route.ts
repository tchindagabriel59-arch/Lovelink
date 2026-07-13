import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        birthDate: users.birthDate,
        gender: users.gender,
        lookingFor: users.lookingFor,
        bio: users.bio,
        city: users.city,
        country: users.country,
        // 📸 TOUTES les photos
        photoUrl: users.photoUrl,
        coverPhotoUrl: users.coverPhotoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        interests: users.interests,
        occupation: users.occupation,
        // 🎯 Prompts style Hinge
        prompt1Question: users.prompt1Question,
        prompt1Answer: users.prompt1Answer,
        prompt2Question: users.prompt2Question,
        prompt2Answer: users.prompt2Answer,
        prompt3Question: users.prompt3Question,
        prompt3Answer: users.prompt3Answer,
        // 📊 Statuts
        isOnline: users.isOnline,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        isIncognito: users.isIncognito,
        isAdmin: users.isAdmin,
        // 📍 Géolocalisation
        latitude: users.latitude,
        longitude: users.longitude,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
