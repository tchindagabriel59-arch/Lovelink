import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes } from "@/db/schema";
import { eq, notInArray, sql, and, or, gte, lte } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les préférences de l'utilisateur actuel
    const [currentUser] = await db
      .select({
        prefGender: users.prefGender,
        prefAgeMin: users.prefAgeMin,
        prefAgeMax: users.prefAgeMax,
        prefLookingFor: users.prefLookingFor,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const prefGender = currentUser?.prefGender || "all";
    const prefAgeMin = currentUser?.prefAgeMin || 18;
    const prefAgeMax = currentUser?.prefAgeMax || 99;
    const prefLookingFor = currentUser?.prefLookingFor || "all";

    // Get IDs the user has already liked/disliked
    const alreadyActed = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const excludeIds = alreadyActed.map((r) => r.toUserId);
    excludeIds.push(userId);

    // Calculer les dates de naissance limites basées sur l'âge
    const now = new Date();
    const maxBirthDate = new Date(
      now.getFullYear() - prefAgeMin,
      now.getMonth(),
      now.getDate()
    ).toISOString().split("T")[0];
    const minBirthDate = new Date(
      now.getFullYear() - prefAgeMax - 1,
      now.getMonth(),
      now.getDate()
    ).toISOString().split("T")[0];

    // Construire les conditions dynamiquement
    const conditions = [
      notInArray(users.id, excludeIds),
      eq(users.isBanned, false),
      lte(users.birthDate, maxBirthDate),
      gte(users.birthDate, minBirthDate),
    ];

    // Filtre par genre
    if (prefGender !== "all") {
      conditions.push(eq(users.gender, prefGender as "male" | "female" | "non_binary" | "other"));
    }

    // Filtre par ce qu'ils cherchent
    if (prefLookingFor !== "all") {
      conditions.push(
        eq(users.lookingFor, prefLookingFor as "relationship" | "friendship" | "casual" | "marriage")
      );
    }

    const profiles = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        birthDate: users.birthDate,
        gender: users.gender,
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
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(20);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
