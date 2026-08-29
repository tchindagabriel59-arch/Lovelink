import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Test connexion BDD tout de suite
    try {
      await db.execute(sql`select 1`);
    } catch (dbErr) {
      console.error("DB CONNECT ERROR:", dbErr);
      return NextResponse.json(
        {
          error: "Erreur base de données",
          details: dbErr instanceof Error ? dbErr.message : String(dbErr),
          step: "db_connect",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const inputIdentifier = String(
      body.email || body.phone || body.identifier || ""
    ).trim();
    const password = String(body.password || "");

    if (!inputIdentifier || !password) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis", step: "validation" },
        { status: 400 }
      );
    }

    const cleanInput = inputIdentifier.toLowerCase();
    const cleanDigits = inputIdentifier.replace(/[\s\-\+\(\)]/g, "");
    const cleanNo237 = cleanDigits.replace(/^237/, "");

    const phoneEmailRaw = `phone_${cleanDigits}@phone.lovelink237.com`;
    const phoneEmailNo237 = `phone_${cleanNo237}@phone.lovelink237.com`;
    const phoneEmailWith237 = `phone_237${cleanNo237}@phone.lovelink237.com`;

    let user: any = null;
    try {
      const rows = await db
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
      user = rows[0] || null;
    } catch (findErr) {
      console.error("FIND USER ERROR:", findErr);
      return NextResponse.json(
        {
          error: "Erreur recherche utilisateur",
          details: findErr instanceof Error ? findErr.message : String(findErr),
          step: "find_user",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect", step: "not_found" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error: "Compte sans mot de passe (passwordHash vide)",
          step: "no_hash",
          userId: user.id,
        },
        { status: 500 }
      );
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (bcryptErr) {
      console.error("BCRYPT ERROR:", bcryptErr);
      return NextResponse.json(
        {
          error: "Erreur vérification mot de passe",
          details:
            bcryptErr instanceof Error ? bcryptErr.message : String(bcryptErr),
          step: "bcrypt",
          hashPrefix: String(user.passwordHash).slice(0, 10),
        },
        { status: 500 }
      );
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect", step: "bad_password" },
        { status: 401 }
      );
    }

    try {
      await db
        .update(users)
        .set({ isOnline: true, lastSeen: new Date() })
        .where(eq(users.id, user.id));
    } catch (e) {
      console.error("lastSeen update error:", e);
      // on continue même si ça échoue
    }

    let token = "";
    try {
      token = await createToken(user.id);
    } catch (tokenErr) {
      console.error("TOKEN ERROR:", tokenErr);
      return NextResponse.json(
        {
          error: "Erreur création session",
          details:
            tokenErr instanceof Error ? tokenErr.message : String(tokenErr),
          step: "token",
        },
        { status: 500 }
      );
    }

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
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login fatal error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la connexion",
        details: error instanceof Error ? error.message : String(error),
        step: "fatal",
      },
      { status: 500 }
    );
  }
}
