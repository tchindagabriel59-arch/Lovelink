import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { logApiCall } from "@/lib/api-logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/auth/login";
  const method = "POST";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const body = await req.json();
    const { email: rawEmail, phone: rawPhone, identifier, password } = body;

    const inputIdentifier = (rawEmail || rawPhone || identifier || "").trim();

    if (!inputIdentifier || !password) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        errorMessage: "Identifiant ou mot de passe manquant",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const cleanInput = inputIdentifier.toLowerCase();
    const cleanPhoneDigits = inputIdentifier.replace(/[\s\-\+\(\)]/g, "");
    const formattedPhone = cleanPhoneDigits.startsWith("237")
      ? cleanPhoneDigits
      : `237${cleanPhoneDigits}`;

    // Recherche de l'utilisateur par EMAIL OU par TÉLÉPHONE (formats variés)
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanInput),
          eq(users.phone, inputIdentifier),
          eq(users.phone, cleanPhoneDigits),
          eq(users.phone, formattedPhone),
          eq(users.email, `phone_${cleanPhoneDigits}@phone.lovelink237.com`)
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
        userAgent,
        ipAddress,
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
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Mettre à jour le statut "En ligne"
    await db
      .update(users)
      .set({ isOnline: true, lastSeen: new Date() })
      .where(eq(users.id, user.id));

    // Création du Token de session
    const token = await createToken(user.id);

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.id,
      errorMessage: `Connexion réussie user ${user.id}`,
      userAgent,
      ipAddress,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        phone: user.phone,
      },
    });

    // Sauvegarde du cookie de session auth_token
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      errorMessage,
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
