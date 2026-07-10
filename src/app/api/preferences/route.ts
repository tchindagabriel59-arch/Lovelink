import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        prefGender: users.prefGender,
        prefAgeMin: users.prefAgeMin,
        prefAgeMax: users.prefAgeMax,
        prefLookingFor: users.prefLookingFor,
        prefMaxDistance: users.prefMaxDistance,
        latitude: users.latitude,
        longitude: users.longitude,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      preferences: {
        gender: user?.prefGender || "all",
        ageMin: user?.prefAgeMin || 18,
        ageMax: user?.prefAgeMax || 99,
        lookingFor: user?.prefLookingFor || "all",
        maxDistance: user?.prefMaxDistance || 999999,
        hasLocation: user?.latitude != null && user?.longitude != null,
      },
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { gender, ageMin, ageMax, lookingFor, maxDistance } = body;

    if (ageMin && (ageMin < 18 || ageMin > 99)) {
      return NextResponse.json(
        { error: "L'âge minimum doit être entre 18 et 99" },
        { status: 400 }
      );
    }

    if (ageMax && (ageMax < 18 || ageMax > 99)) {
      return NextResponse.json(
        { error: "L'âge maximum doit être entre 18 et 99" },
        { status: 400 }
      );
    }

    if (ageMin && ageMax && ageMin > ageMax) {
      return NextResponse.json(
        { error: "L'âge minimum ne peut pas être supérieur au maximum" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        prefGender: gender,
        prefAgeMin: ageMin,
        prefAgeMax: ageMax,
        prefLookingFor: lookingFor,
        prefMaxDistance: maxDistance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
