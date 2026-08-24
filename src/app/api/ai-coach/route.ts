import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function callGroqAI(messages: { role: string; content: string }[]) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("La clé GROQ_API_KEY n'est pas configurée dans les variables Vercel.");
  }

  // 🎯 MODÈLES VALIDES ET ACTIFS SUR GROQ (TOUS LES ANCIENS MODÈLES SUPPRIMÉS ONT ÉTÉ RETIRÉS)
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
  ];

  let lastErr = "";

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 350,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastErr = `Groq (${model}) [${res.status}]: ${errJson.error?.message || res.statusText}`;
        console.error(lastErr);
      }
    } catch (e: any) {
      lastErr = `Erreur réseau Groq (${model}): ${e?.message || String(e)}`;
      console.error(lastErr);
    }
  }

  throw new Error(lastErr || "Aucun modèle Groq n'a répondu.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé (session expirée)" }, { status: 401 });
    }

    let u: any = null;
    try {
      const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      u = userRecord;
    } catch (dbErr) {
      console.error("DB Error in ai-coach:", dbErr);
    }

    const body = await req.json();
    const { action, targetName, targetCity, userPrompt } = body as {
      action?: string;
      targetName?: string;
      targetCity?: string;
      userPrompt?: string;
    };

    const userName = u?.firstName || "Utilisateur";
    const userGender = u?.gender === "male" ? "un Homme" : u?.gender === "female" ? "une Femme" : "Non précisé";
    const userCity = u?.city || targetCity || "Cameroun";

    const systemPrompt = `Tu es Gabi AI, le coach virtuel officiel de séduction sur LoveLink au Cameroun et en Afrique francophone.
Tu discutes avec ${userName} (${userGender}, vit à ${userCity}).

Règles de comportement :
1. Réponds de manière très chaleureuse, naturelle, drôle et séduisante avec des émojis.
2. Adaptes TOUJOURS tes propos au genre de ${userName} (${userGender}). Si ${userName} est un homme, parle-lui comme à un homme et donne-lui des bios pour homme !
3. Sois concis (maximum 3 à 4 phrases).
4. Sois très adapté à la culture africaine francophone (Yaoundé, Douala, Dakar, Abidjan).`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt || "Conseil de drague" },
    ];

    const aiResponse = await callGroqAI(messages);

    return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });
  } catch (error: any) {
    console.error("Gabi AI Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne Gabi AI" },
      { status: 500 }
    );
  }
}
