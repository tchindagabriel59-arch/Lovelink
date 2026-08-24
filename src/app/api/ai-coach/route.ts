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

  const models = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
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

      const data = await res.json();

      if (res.ok) {
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        lastErr = `Modèle ${model} : ${data.error?.message || res.statusText}`;
      }
    } catch (e: any) {
      lastErr = `Erreur réseau sur ${model}`;
    }
  }

  throw new Error(lastErr || "Aucun modèle d'IA n'a répondu.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const u = user as any;

    const body = await req.json();
    const { action, targetName, targetCity, userPrompt } = body as {
      action?: string;
      targetName?: string;
      targetCity?: string;
      userPrompt?: string;
    };

    const userName = u?.firstName || "Utilisateur";
    const userGender = u?.gender === "male" ? "Homme" : "Femme";
    const userCity = u?.city || "Cameroun";
    const target = targetName || "ton match";

    const systemPrompt = `Tu es Gabi AI, le coach virtuel officiel de séduction sur LoveLink.
Interlocuteur : ${userName}, ${userGender}, ville: ${userCity}.
Ton style : Charismatique, drôle, chaleureux, expert en drague en Afrique.
Réponds en français avec des émojis. Maximum 3-4 phrases.`;

    // 💬 1. PHRASES D'ACCROCHE POUR LE CHAT MESSAGERIE
    if (action === "icebreaker") {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Donne-moi 3 phrases d'accroche courtes, originales et séduisantes pour engager la conversation avec ${target}.
RÈGLE STRICTE : Donne exactement 3 phrases, une par ligne. Pas de numérotation, pas d'introduction, pas de guillemets.`,
        },
      ];

      let suggestions: string[] = [];
      try {
        const aiResponse = await callGroqAI(messages);
        if (aiResponse) {
          suggestions = aiResponse
            .split("\n")
            .map((s: string) => s.replace(/^[0-9.-]+\s*/, "").replace(/^["'-]/, "").replace(/["'-]$/, "").trim())
            .filter((s: string) => s.length > 5)
            .slice(0, 3);
        }
      } catch (err) {
        console.error("Icebreaker AI Error:", err);
      }

      // Si l'IA n'a pas renvoyé 3 lignes propres, fallback sur 3 superbes phrases
      if (suggestions.length < 3) {
        suggestions = [
          `Salut ${target} ! J'ai vu ta photo, ton sourire m'a captivé 😊 C'est quoi ton endroit préféré pour un verre ?`,
          `Coucou ${target} ! Ravi d'avoir matché avec toi ✨ Tu fais quoi de beau aujourd'hui ?`,
          `Salut ${target} ! On parie que j'arrive à te faire sourire en moins de 3 messages ? 😉`,
        ];
      }

      return NextResponse.json({ coachName: "Gabi AI", suggestions });
    }

    // 💬 2. DISCUSSION LIBRE (CHAT GABI AI)
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt || "Donne-moi un conseil de drague." },
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
