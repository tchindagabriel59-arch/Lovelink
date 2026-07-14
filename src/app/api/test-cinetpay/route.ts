import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Sécurité : seul l'admin peut tester
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Vérifier les variables d'environnement
    const apiKey = process.env.CINETPAY_API_KEY;
    const apiPassword = process.env.CINETPAY_API_PASSWORD;
    const mode = process.env.CINETPAY_MODE;

    const diagnostics = {
      apiKey: {
        exists: !!apiKey,
        length: apiKey?.length || 0,
        startsWith: apiKey?.substring(0, 8) || "N/A",
        endsWith: apiKey?.substring(apiKey.length - 4) || "N/A",
        hasSpaceStart: apiKey?.startsWith(" ") || false,
        hasSpaceEnd: apiKey?.endsWith(" ") || false,
      },
      apiPassword: {
        exists: !!apiPassword,
        length: apiPassword?.length || 0,
        hasSpaceStart: apiPassword?.startsWith(" ") || false,
        hasSpaceEnd: apiPassword?.endsWith(" ") || false,
      },
      mode: mode || "N/A",
    };

    // Test réel : essayer le login
    console.log("🧪 Test login CinetPay...");
    const loginResponse = await fetch("https://api.cinetpay.net/v1/oauth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        api_password: apiPassword,
      }),
    });

    const loginData = await loginResponse.text();

    return NextResponse.json({
      diagnostics,
      loginTest: {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        response: loginData,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
