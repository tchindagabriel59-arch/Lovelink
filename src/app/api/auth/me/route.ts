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
        photoUrl: users.photoUrl,
        coverPhotoUrl: users.coverPhotoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        interests: users.interests,
        occupation: users.occupation,
        prompt1Question: users.prompt1Question,
        prompt1Answer: users.prompt1Answer,
        prompt2Question: users.prompt2Question,
        prompt2Answer: users.prompt2Answer,
        prompt3Question: users.prompt3Question,
        prompt3Answer: users.prompt3Answer,
        isOnline: users.isOnline,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        isIncognito: users.isIncognito,
        isAdmin: users.isAdmin,
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

    // ⚡ Cache 60 secondes côté navigateur
    // Évite de refaire la requête à chaque navigation
    return NextResponse.json(
      { user },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
