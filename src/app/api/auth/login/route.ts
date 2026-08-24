import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setAuthCookie } from "@/lib/auth";
import { logApiCall } from "@/lib/api-logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/auth/login";
  const method = "POST";

  try {
    const body = await req.json();
    const { email: identifierInput, password } = body;

    if (!identifierInput || !password) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const cleanInput = identifierInput.trim().toLowerCase();
    // Nettoyage du numéro de téléphone (enlève les espaces, tirets)
    const cleanPhone = identifierInput.replace(/[\s\-\+\(\)]/g, "");

    // Recherche de l'utilisateur par EMAIL OU par NUMÉRO DE TÉLÉPHONE
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanInput),
          eq(users.phone, cleanInput),
          eq(users.phone, cleanPhone),
          eq(users.phone, `+${cleanPhone}`)
        )
      )
      .limit(1);

    if (!user) {
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        errorMessage: `Identifiant introuvable : ${cleanInput}`,
      });

      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        userId: user.id,
        errorMessage: `Mot de passe incorrect pour user ${user.id}`,
      });

      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Mettre à jour l'état "En ligne"
    await db
      .update(users)
      .set({ isOnline: true, lastSeen: new Date() })
      .where(eq(users.id, user.id));

    // Créer le cookie de session
    await setAuthCookie(user.id);

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.id,
      errorMessage: `Connexion réussie user ${user.id}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
