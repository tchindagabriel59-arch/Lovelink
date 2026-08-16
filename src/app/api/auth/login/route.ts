import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { logApiCall } from "@/lib/api-logger";

export async function POST(req: NextRequest) {
  // ✅ MONITORING : Capture le temps de départ
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
    const { email, password } = body;

    if (!email || !password) {
      // ✅ LOG : Erreur 400 - champs manquants
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        errorMessage: "Email ou mot de passe manquant",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // ✅ LOG : Erreur 401 - user inexistant
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        errorMessage: `Email introuvable : ${email}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // ✅ LOG : Erreur 401 - mauvais mot de passe
      logApiCall({
        endpoint,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        userId: user.id,
        errorMessage: "Mot de passe incorrect",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // 🚫 BLOQUER LES UTILISATEURS BANNIS
    if (user.isBanned) {
      // ✅ LOG : Erreur 403 - utilisateur banni
      logApiCall({
        endpoint,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
        userId: user.id,
        errorMessage: "Utilisateur banni tente de se connecter",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        {
          error:
            "🚫 Votre compte a été suspendu pour non-respect des règles de la communauté. Pour toute réclamation, contactez lovelink237@gmail.com",
        },
        { status: 403 }
      );
    }

    await db
      .update(users)
      .set({ isOnline: true, lastSeen: new Date() })
      .where(eq(users.id, user.id));

    const token = await createToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // ✅ LOG : Succès 200 - connexion réussie
    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.id,
      userAgent,
      ipAddress,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // ✅ LOG : Erreur 500 - erreur serveur
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
