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
        interests: users.interests,
        occupation: users.occupation,
        isOnline: users.isOnline,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        isAdmin: users.isAdmin,
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
