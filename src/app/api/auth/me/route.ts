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
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // ⚡ VÉRIFICATION ET AUTO-NETTOYAGE DU PREMIUM EXPIRÉ
    const now = new Date();
    let isPremiumActive = user.isPremium;

    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) <= now
    ) {
      isPremiumActive = false;

      // Mise à jour silencieuse en BDD
      await db
        .update(users)
        .set({
          isPremium: false,
          premiumPlan: null,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      gender: user.gender,
      lookingFor: user.lookingFor,
      bio: user.bio,
      city: user.city,
      country: user.country,
      photoUrl: user.photoUrl,
      coverPhotoUrl: user.coverPhotoUrl,
      photo1Url: user.photo1Url,
      photo2Url: user.photo2Url,
      photo3Url: user.photo3Url,
      photo4Url: user.photo4Url,
      interests: user.interests,
      occupation: user.occupation,
      prompt1Question: user.prompt1Question,
      prompt1Answer: user.prompt1Answer,
      prompt2Question: user.prompt2Question,
      prompt2Answer: user.prompt2Answer,
      prompt3Question: user.prompt3Question,
      prompt3Answer: user.prompt3Answer,
      isOnline: user.isOnline,
      isPremium: isPremiumActive, // 👈 Statut corrigé en temps réel
      premiumExpiresAt: user.premiumExpiresAt,
      premiumPlan: isPremiumActive ? user.premiumPlan : null,
      isVerified: user.isVerified,
      isIncognito: user.isIncognito,
      isAdmin: user.isAdmin,
      latitude: user.latitude,
      longitude: user.longitude,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      { user: safeUser },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
