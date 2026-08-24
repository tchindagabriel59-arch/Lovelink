import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// 🤖 FONCTION D'APPEL DIRECT À L'IA GROQ
async function callGroqAI(messages: { role: string; content: string }[]) {
  if (!GROQ_API_KEY) {
    throw new Error("La clé GROQ_API_KEY n'est pas configurée dans les variables d'environnement Vercel.");
  }

  // Modèles Groq actuellement actifs
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const errText = await res.text();
        lastError = `Groq (${model}) error [${res.status}]: ${errText}`;
        console.error(lastError);
      }
    } catch (err) {
      lastError = `Fetch error (${model}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(lastError);
    }
  }

  throw new Error(lastError || "Impossible de contacter les serveurs Groq AI.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Charger l'utilisateur en BDD pour connaître son VRAI genre, prénom et ville
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
    const userGender = u?.gender === "male" ? "un Homme" : u?.gender === "female" ? "une Femme" : "Non précisé";
    const userCity = u?.city || targetCity || "Cameroun";

    // 🧠 SYSTEM PROMPT DE SÉDUCTION POUR NDOLO / GABI AI
    const systemPrompt = `Tu es Gabi AI, le coach virtuel de séduction officiel de l'application LoveLink.
Tu es en train de discuter avec ${userName}.
Informations sur ${userName} :
- Genre : ${userGender}
- Ville : ${userCity}

Ton rôle :
- Réponds de manière super intelligente, naturelle, chaleureuse et dynamique (avec des émojis).
- Adaptes TOUJOURS tes réponses au genre de ${userName} (${userGender}). Si ${userName} est un homme et te demande une bio, rédige une bio d'homme viril, drôle et classe.
- Ne donne JAMAIS de réponses génériques. Sois créatif, captivant et va droit au but.
- Sois très pertinent pour le contexte africain (Cameroun, Douala, Yaoundé, Dakar, etc.).`;

    // 💬 1. DISCUSSION LIBRE (CHAT)
    if (action === "chat" || userPrompt) {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt || "Bonjour Gabi AI !" },
      ];

      const aiResponse = await callGroqAI(messages);
      return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });
    }

    // 💬 2. PHRASES D'ACCROCHE POUR LA MESSAGERIE
    if (action === "icebreaker") {
      const target = targetName || "la personne";
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Propose-moi 3 phrases d'accroche originales et captivantes pour engager la conversation avec ${target} qui vit à ${userCity}. Renvoie uniquement les 3 phrases séparées par une ligne.`,
        },
      ];

      const aiResponse = await callGroqAI(messages);
      const suggestions = aiResponse
        .split("\n")
        .map((s: string) => s.replace(/^[0-9.-]+\s*/, "").trim())
        .filter((s: string) => s.length > 5)
        .slice(0, 3);

      return NextResponse.json({ coachName: "Gabi AI", suggestions });
    }

    // 💡 3. CONSEIL / BIO PAR DÉFAUT
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Donne-moi un conseil du jour captivant pour réussir mes rencontres sur LoveLink." },
    ];

    const aiAdvice = await callGroqAI(messages);
    return NextResponse.json({ coachName: "Gabi AI", advice: aiAdvice });

  } catch (error) {
    console.error("Gabi AI Route Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Erreur de connexion à Gabi AI" },
      { status: 500 }
    );
  }
}
