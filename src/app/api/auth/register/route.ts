import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/emails";

// 🎯 Auto-définir la préférence de genre selon le genre de l'utilisateur
// Logique HÉTÉRO par défaut (le plus courant), modifiable ensuite dans /preferences
function getDefaultPrefGender(userGender: string): "male" | "female" | "non_binary" | "other" | null {
  switch (userGender) {
    case "male":
      return "female"; // Homme → voit des femmes par défaut
    case "female":
      return "male"; // Femme → voit des hommes par défaut
    case "non_binary":
    case "other":
      return null; // null = "all" (voit tout le monde)
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, birthDate, gender } = body;

    if (!email || !password || !firstName || !lastName || !birthDate || !gender) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // 🎯 Définir automatiquement la préférence de genre
    const defaultPrefGender = getDefaultPrefGender(gender);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        birthDate,
        gender,
        prefGender: defaultPrefGender, // 🎯 Auto-défini
        prefAgeMin: 18,
        prefAgeMax: 99,
      })
      .returning();

    const token = await createToken(newUser.id);

    // 📧 Envoyer l'email de bienvenue (en asynchrone, ne bloque pas l'inscription)
    sendWelcomeEmail(email, firstName).catch((err) => {
      console.error("Erreur envoi email bienvenue:", err);
    });

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
