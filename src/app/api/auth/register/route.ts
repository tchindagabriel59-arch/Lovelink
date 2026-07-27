import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/emails";
import { sendMetaEvent, getClientIp, generateEventId } from "@/lib/meta-capi";

// 🎯 Auto-définir la préférence de genre selon le genre de l'utilisateur
function getDefaultPrefGender(userGender: string): "male" | "female" | "non_binary" | "other" | null {
  switch (userGender) {
    case "male":
      return "female";
    case "female":
      return "male";
    case "non_binary":
    case "other":
      return null;
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, birthDate, gender, eventId: clientEventId } = body;

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
        prefGender: defaultPrefGender,
        prefAgeMin: 18,
        prefAgeMax: 99,
      })
      .returning();

    const token = await createToken(newUser.id);

    // 📧 Email de bienvenue (async, ne bloque pas)
    sendWelcomeEmail(email, firstName).catch((err) => {
      console.error("Erreur envoi email bienvenue:", err);
    });

    // 🔥 META CAPI - CompleteRegistration (serveur -> Meta)
    // On utilise le même eventId que le Pixel pour la déduplication
    const metaEventId = clientEventId || generateEventId();
    
    try {
      const clientIp = getClientIp(req as any);
      const userAgent = req.headers.get('user-agent') || undefined;
      const fbp = req.cookies.get('_fbp')?.value;
      const fbc = req.cookies.get('_fbc')?.value;
      const referer = req.headers.get('referer');
      const eventSourceUrl = referer || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelink237.com'}/register`;

      // Ne pas bloquer l'inscription si Meta échoue
      await sendMetaEvent({
        eventName: 'CompleteRegistration',
        eventId: metaEventId,
        eventSourceUrl,
        userData: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          country: 'sn',
          clientIpAddress: clientIp,
          clientUserAgent: userAgent,
          fbp: fbp,
          fbc: fbc,
        },
        customData: {
          content_name: 'Inscription LoveLink',
        }
      });
    } catch (capiError) {
      console.error("[Meta CAPI] Erreur CompleteRegistration:", capiError);
      // On continue, on ne bloque pas l'inscription
    }

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      metaEventId, // 🔥 Renvoyé au frontend pour déduplication Pixel
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
