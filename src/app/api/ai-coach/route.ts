import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function callGroqAI(messages: { role: string; content: string }[]) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("La clé GROQ_API_KEY n'est pas configurée dans Vercel.");
  }

  // 🎯 NOUVEAUX MODÈLES OFFICIELS 2026 (D'après ta documentation Groq)
  const models = [
    "gpt-oss-120b", // Ton modèle préféré
    "qwen-3.6-27b", // Le remplaçant recommandé n°2
    "gpt-oss-20b"   // Le remplaçant léger
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
        lastErr = `Groq (${model}) : ${errJson.error?.message || res.statusText}`;
        console.error(lastErr);
      }
    } catch (e: any) {
      lastErr = `Erreur réseau sur ${model}`;
    }
  }

  throw new Error(lastErr || "L'IA est indisponible pour le moment.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Charger les infos pour que Gabi AI sache à qui il parle
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const u = user as any;

    const body = await req.json();
    const { userPrompt } = body;

    const userName = u?.firstName || "Utilisateur";
    const userGender = u?.gender === "male" ? "Homme" : "Femme";
    const userCity = u?.city || "Cameroun";

    const systemPrompt = `Tu es Gabi AI, le coach de séduction intelligent de LoveLink. 
Ton interlocuteur : ${userName}, ${userGender}, ville: ${userCity}.
Ton style : Charismatique, drôle, expert en relations en Afrique.
Instructions : Réponds toujours en français. Maximum 3-4 phrases. Utilise des émojis.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt || "Donne-moi un conseil de drague." },
    ];

    const aiResponse = await callGroqAI(messages);

    return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });

  } catch (error: any) {
    console.error("Gabi AI Error:", error.message);
    return NextResponse.json(
      { error: error?.message || "Erreur de connexion à Gabi AI" },
      { status: 500 }
    );
  }
}
