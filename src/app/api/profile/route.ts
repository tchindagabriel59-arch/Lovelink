import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, city, country, photoUrl, interests, occupation, lookingFor } = body;

    const [updated] = await db
      .update(users)
      .set({
        bio: bio ?? undefined,
        city: city ?? undefined,
        country: country ?? undefined,
        photoUrl: photoUrl ?? undefined,
        interests: interests ?? undefined,
        occupation: occupation ?? undefined,
        lookingFor: lookingFor ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        bio: updated.bio,
        city: updated.city,
        country: updated.country,
        photoUrl: updated.photoUrl,
        interests: updated.interests,
        occupation: updated.occupation,
        lookingFor: updated.lookingFor,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
