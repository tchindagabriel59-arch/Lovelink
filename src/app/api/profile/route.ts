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
    const {
      bio,
      city,
      country,
      photoUrl,
      coverPhotoUrl,
      photo1Url,
      photo2Url,
      photo3Url,
      photo4Url,
      interests,
      occupation,
      lookingFor,
      prompt1Question,
      prompt1Answer,
      prompt2Question,
      prompt2Answer,
      prompt3Question,
      prompt3Answer,
    } = body;

    const [updated] = await db
      .update(users)
      .set({
        bio: bio ?? undefined,
        city: city ?? undefined,
        country: country ?? undefined,
        photoUrl: photoUrl ?? undefined,
        coverPhotoUrl: coverPhotoUrl ?? undefined,
        photo1Url: photo1Url ?? undefined,
        photo2Url: photo2Url ?? undefined,
        photo3Url: photo3Url ?? undefined,
        photo4Url: photo4Url ?? undefined,
        interests: interests ?? undefined,
        occupation: occupation ?? undefined,
        lookingFor: lookingFor ?? undefined,
        prompt1Question: prompt1Question ?? undefined,
        prompt1Answer: prompt1Answer ?? undefined,
        prompt2Question: prompt2Question ?? undefined,
        prompt2Answer: prompt2Answer ?? undefined,
        prompt3Question: prompt3Question ?? undefined,
        prompt3Answer: prompt3Answer ?? undefined,
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
        coverPhotoUrl: updated.coverPhotoUrl,
        photo1Url: updated.photo1Url,
        photo2Url: updated.photo2Url,
        photo3Url: updated.photo3Url,
        photo4Url: updated.photo4Url,
        interests: updated.interests,
        occupation: updated.occupation,
        lookingFor: updated.lookingFor,
        prompt1Question: updated.prompt1Question,
        prompt1Answer: updated.prompt1Answer,
        prompt2Question: updated.prompt2Question,
        prompt2Answer: updated.prompt2Answer,
        prompt3Question: updated.prompt3Question,
        prompt3Answer: updated.prompt3Answer,
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
