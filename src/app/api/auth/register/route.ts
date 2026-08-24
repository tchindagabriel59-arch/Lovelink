import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/emails";
import { sendMetaEvent, getClientIp, generateEventId } from "@/lib/meta-capi";
import { 
  generateUniqueReferralCode, 
  findUserByReferralCode, 
  applyReferralReward 
} from "@/lib/referral";
import { logApiCall } from "@/lib/api-logger";

function getDefaultPrefGender(userGender: string): "male" | "female" | "non_binary" | "other" | null {
  switch (userGender) {
    case "male":
      return "female";
    case "female":
      return "male";
    default:
      return null;
  }
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/auth/register";
  const method = "POST";
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const body = await req.json();
    const { 
      email: rawEmail, 
      phone: rawPhone,
      identifier,
      password, 
      firstName, 
      lastName, 
      birthDate, 
      gender, 
      lookingFor,
      city,
      country,
      occupation,
      maritalStatus,
      discoverySource,
      photoUrl,
      eventId: clientEventId,
      referralCode: providedReferralCode,
    } = body;

    // 1. Identification de l'identifiant (Email ou Numéro de téléphone)
    const inputIdentifier = (rawEmail || rawPhone || identifier || "").trim();

    if (!inputIdentifier || !password || !firstName || !birthDate || !gender) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        errorMessage: "Champs requis manquants",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Tous les champs obligatoires sont requis" },
        { status: 400 }
      );
    }

    const isEmail = inputIdentifier.includes("@");
    let finalEmail = "";
    let finalPhone = "";

    if (isEmail) {
      finalEmail = inputIdentifier.toLowerCase().trim();
    } else {
      const cleanPhoneDigits = inputIdentifier.replace(/[\s\-\+\(\)]/g, "");
      finalPhone = cleanPhoneDigits.startsWith("237") ? cleanPhoneDigits : `237${cleanPhoneDigits}`;
      // Format d'e-mail interne dérivé du numéro de téléphone
      finalEmail = `phone_${cleanPhoneDigits}@phone.lovelink237.com`;
    }

    if (calculateAge(birthDate) < 18) {
      return NextResponse.json(
        { error: "Vous devez avoir au moins 18 ans" },
        { status: 400 }
      );
    }

    const validGenders = ["male", "female", "non_binary", "other"];
    if (!validGenders.includes(gender)) {
      return NextResponse.json({ error: "Genre invalide" }, { status: 400 });
    }

    // 2. Vérification des doublons via l'email (réel ou dérivé du numéro)
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, finalEmail))
      .limit(1);

    if (existing.length > 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 409,
        durationMs: Date.now() - startTime,
        errorMessage: isEmail ? `Email déjà utilisé : ${finalEmail}` : `Téléphone déjà utilisé : ${finalPhone}`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: isEmail ? "Cet email est déjà utilisé" : "Ce numéro de téléphone est déjà utilisé" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const defaultPrefGender = getDefaultPrefGender(gender);
    const newReferralCode = await generateUniqueReferralCode(firstName);

    let referrer = null;
    if (providedReferralCode && providedReferralCode.trim() !== "") {
      referrer = await findUserByReferralCode(providedReferralCode);
    }

    const validLookingFor = ["relationship", "friendship", "casual", "marriage"] as const;
    const safeLookingFor = validLookingFor.includes(lookingFor) ? lookingFor : "relationship";

    // 3. Insertion de l'utilisateur
    const [newUser] = await db
      .insert(users)
      .values({
        email: finalEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: (lastName || "").trim(),
        birthDate,
        gender,
        lookingFor: safeLookingFor,
        city: city?.trim() || "",
        country: country?.trim() || "Cameroun",
        occupation: occupation?.trim() || "",
        maritalStatus: maritalStatus?.trim() || "",
        discoverySource: discoverySource?.trim() || "",
        photoUrl: photoUrl || "",
        prefGender: defaultPrefGender,
        prefAgeMin: 18,
        prefAgeMax: 99,
        referralCode: newReferralCode,
        referredBy: referrer?.id || null,
      } as any)
      .returning();

    const token = await createToken(newUser.id);

    if (referrer) {
      applyReferralReward(referrer.id, newUser.id).catch((err) => {
        console.error("Erreur applyReferralReward:", err);
      });
    }

    // Envoyer l'email de bienvenue seulement aux vrais emails
    if (isEmail && !finalEmail.includes("@phone.lovelink237.com")) {
      sendWelcomeEmail(finalEmail, firstName).catch((err) => {
        console.error("Erreur envoi email bienvenue:", err);
      });
    }

    const metaEventId = clientEventId || generateEventId();
    
    try {
      const clientIp = getClientIp(req as any);
      const capiUserAgent = req.headers.get('user-agent') || undefined;
      const fbp = req.cookies.get('_fbp')?.value;
      const fbc = req.cookies.get('_fbc')?.value;
      const referer = req.headers.get('referer');
      const eventSourceUrl = referer || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelink237.com'}/register`;

      await sendMetaEvent({
        eventName: 'CompleteRegistration',
        eventId: metaEventId,
        eventSourceUrl,
        userData: {
          email: isEmail ? finalEmail : undefined,
          firstName,
          lastName,
          country: 'cm',
          clientIpAddress: clientIp,
          clientUserAgent: capiUserAgent,
          fbp,
          fbc,
        },
        customData: {
          content_name: 'Inscription LoveLink',
        }
      });
    } catch (capiError) {
      console.error("[Meta CAPI] Erreur CompleteRegistration:", capiError);
    }

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        referralCode: newUser.referralCode,
      },
      metaEventId,
      referralApplied: !!referrer,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: newUser.id,
      errorMessage: referrer 
        ? `Inscription OK (${isEmail ? "Email" : "Téléphone"}, parrainage: ${providedReferralCode})` 
        : `Inscription OK (${isEmail ? "Email" : "Téléphone"})`,
      userAgent,
      ipAddress,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
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
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
