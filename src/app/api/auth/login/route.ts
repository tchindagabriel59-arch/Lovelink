import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: rawEmail, phone: rawPhone, identifier, password } = body;

    const inputIdentifier = (rawEmail || rawPhone || identifier || "").trim();

    if (!inputIdentifier || !password) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const cleanInput = inputIdentifier.toLowerCase();
    const cleanDigits = inputIdentifier.replace(/[\s\-\+\(\)]/g, "");

    // Adresses e-mails synthétiques générées pour les numéros de téléphone
    const phoneEmailRaw = `phone_${cleanDigits}@phone.lovelink237.com`;
    const cleanNo237 = cleanDigits.replace(/^237/, "");
    const phoneEmailNo237 = `phone_${cleanNo237}@phone.lovelink237.com`;
    const phoneEmailWith237 = `phone_237${cleanNo237}@phone.lovelink237.com`;

    // Recherche de l'utilisateur par EMAIL
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanInput),
          eq(users.email, phoneEmailRaw),
          eq(users.email, phoneEmailNo237),
          eq(users.email, phoneEmailWith237)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Mettre à jour le statut "En ligne"
    try {
      await db
        .update(users)
        .set({ isOnline: true, lastSeen: new Date() })
        .where(eq(users.id, user.id));
    } catch (e) {
      console.error("Erreur maj lastSeen:", e);
    }

    // Création du Token de session
    const token = await createToken(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 an
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
