import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
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

    // 🔍 ÉTAPE 1 : Récupérer notre IP publique (celle que Vercel utilise pour sortir)
    let myIp = "unknown";
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      myIp = ipData.ip;
    } catch (e) {
      myIp = "erreur récupération IP";
    }

    // ÉTAPE 2 : Test CinetPay
    const apiKey = process.env.CINETPAY_API_KEY;
    const apiPassword = process.env.CINETPAY_API_PASSWORD;

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
      messageImportant: "👉 Ajoute l'IP ci-dessous dans la liste blanche CinetPay",
      vercelIp: myIp,
      cinetpayResponse: {
        status: loginResponse.status,
        body: loginData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
