import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function callGroqAI(messages: { role: string; content: string }[]) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("La clé GROQ_API_KEY est manquante sur Vercel.");
  }

  // 🎯 NOUVEAUX MODÈLES RECOMMANDÉS PAR TON MAIL (Post-Août 2026)
  // On utilise les IDs officiels de Groq pour ces modèles
  const models = [
    "llama-3.1-70b-versatile", // Le remplaçant direct et stable
    "qwen-2.5-7b-chat",        // Recommandé explicitement dans ton mail
    "llama-3.1-8b-instant"     // Modèle de secours rapide
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
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastErr = `Erreur Groq sur ${model} : ${errJson.error?.message || res.statusText}`;
      }
    } catch (e: any) {
      lastErr = `Erreur réseau sur ${model} : ${e?.message}`;
    }
  }

  throw new Error(lastErr || "Aucun modèle IA n'est disponible pour le moment.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Session expirée" }, { status: 401 });
    }

    // Charger les infos de l'utilisateur pour personnaliser l'IA
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const u = user as any;

    const body = await req.json();
    const { userPrompt } = body;

    const userName = u?.firstName || "Gabriel";
    const userGender = u?.gender === "male" ? "Homme" : "Femme";
    const userCity = u?.city || "Cameroun";

    // 🧠 INSTRUCTIONS STRICTES POUR GABI AI
    const systemPrompt = `Tu es Gabi AI, l'assistant virtuel de séduction de l'application LoveLink. 
Tu es expert en relations amoureuses en Afrique (Cameroun, Sénégal, etc.).
Ton interlocuteur est ${userName}, un ${userGender} vivant à ${userCity}.

DIRECTIVES :
1. Réponds avec intelligence, charisme et humour.
2. Si on te demande une biographie, rédige une présentation UNIQUE, attirante et classe adaptée au genre de l'utilisateur (${userGender}).
3. Utilise des émojis et un ton complice.
4. Maximum 4 phrases. Ne sois jamais générique.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt || "Donne-moi un conseil." },
    ];

    const aiResponse = await callGroqAI(messages);

    return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur de connexion à l'IA" },
      { status: 500 }
    );
  }
}
