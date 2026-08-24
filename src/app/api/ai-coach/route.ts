import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function callGroqAI(messages: { role: string; content: string }[]) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("La clé GROQ_API_KEY est manquante sur Vercel.");
  }

  // 🎯 UTILISATION DES IDS EXACTS DE TA DOCUMENTATION
  const models = [
    "openai/gpt-oss-120b", // Le remplaçant de Llama 3.3
    "qwen/qwen3.6-27b",    // Le remplaçant de Llama 3.1
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile", // On le garde au cas où
    "llama-3.1-8b-instant"
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
          max_tokens: 500,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        lastErr = `Modèle ${model} : ${data.error?.message || res.statusText}`;
        console.error(lastErr);
      }
    } catch (e: any) {
      lastErr = `Erreur réseau sur ${model}`;
    }
  }

  throw new Error(lastErr || "Aucun modèle de ta doc n'est accessible.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const u = user as any;

    const body = await req.json();
    const { userPrompt } = body;

    const userName = u?.firstName || "Gabriel";
    const userGender = u?.gender === "male" ? "Homme" : "Femme";
    const userCity = u?.city || "Cameroun";

    const systemPrompt = `Tu es Gabi AI, le coach de séduction intelligent de LoveLink. 
Interlocuteur : ${userName}, ${userGender}, ville: ${userCity}.
Ton style : Charismatique, drôle, expert en Afrique.
IMPORTANT : Si on te demande une bio, rédige une présentation percutante adaptée à un ${userGender}.
Réponds en 3-4 phrases maximum avec des émojis.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt || "Donne-moi un conseil." },
    ];

    const aiResponse = await callGroqAI(messages);

    return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur Gabi AI" },
      { status: 500 }
    );
  }
}
