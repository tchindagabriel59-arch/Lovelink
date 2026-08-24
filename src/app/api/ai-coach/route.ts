import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function callGroqAI(messages: { role: string; content: string }[]) {
  if (!GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      console.error("Groq API error status:", res.status);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("Groq API fetch error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetName, targetCity, userGender, userPrompt } = body as {
      action: "bio" | "icebreaker" | "advice" | "chat";
      targetName?: string;
      targetCity?: string;
      userGender?: string;
      userPrompt?: string;
    };

    const name = targetName?.trim() || "la personne";
    const city = targetCity?.trim() || "Cameroun";

    // SYSTEM PROMPT GLOBAL DE GABI AI
    const systemPrompt = `Tu es Gabi AI, le coach virtuel officiel en séduction de l'application de rencontre LoveLink au Cameroun et en Afrique francophone.
Ton rôle est de donner des conseils de drague drôles, bienveillants, polis et ultra efficaces adaptés à la culture locale (Yaoundé, Douala, Dakar, Abidjan).
Réponds en français, avec un ton dynamique, chaleureux et complice (utilise des émojis). Sois concis (maximum 3 phrases courtes).`;

    // 💬 1. DISCUSSION LIBRE AVEC GABI AI (POUR LA MODALE FLOTTANTE)
    if (action === "chat" || userPrompt) {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt || "Donne-moi un conseil de drague rapide." },
      ];

      const aiResponse = await callGroqAI(messages);

      if (aiResponse) {
        return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });
      }
    }

    // 💬 2. ACCROCHES POUR MESSAGERIE
    if (action === "icebreaker") {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Propose-moi 3 phrases d'accroche originales et séduisantes pour engager la conversation avec ${name} qui vit à ${city}. Renvoie uniquement les 3 phrases séparées par une ligne.`,
        },
      ];

      const aiResponse = await callGroqAI(messages);

      if (aiResponse) {
        const suggestions = aiResponse
          .split("\n")
          .map((s) => s.replace(/^[0-9.-]+\s*/, "").trim())
          .filter((s) => s.length > 5)
          .slice(0, 3);

        if (suggestions.length > 0) {
          return NextResponse.json({ coachName: "Gabi AI", suggestions });
        }
      }

      // Fallback si pas de clé Groq
      const fallbackSuggestions = [
        `Salut ${name} ! J'ai vu que tu es à ${city}. C'est quoi ton endroit préféré pour prendre un verre au calme ? 😊`,
        `Coucou ${name} ! Ton profil m'a direct fait sourire ! Tu fais quoi de beau dans la vie ? ✨`,
        `Salut ${name} ! Si on devait organiser notre premier date idéal, tu choisirais quoi ? 🍕☕`,
      ];
      return NextResponse.json({ coachName: "Gabi AI", suggestions: fallbackSuggestions });
    }

    // 🪄 3. GÉNÉRATEUR DE BIO
    if (action === "bio") {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Rédige une bio de profil de rencontre courte, attirante et drôle pour un/une célibataire ${userGender === "male" ? "homme" : "femme"} à ${city}. Maximum 2 phrases avec émojis.`,
        },
      ];

      const aiResponse = await callGroqAI(messages);
      if (aiResponse) {
        return NextResponse.json({ coachName: "Gabi AI", bio: aiResponse });
      }
    }

    // 💡 4. CONSEILS PAR DÉFAUT
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Donne-moi un conseil du jour original pour réussir sur l'application de rencontre." },
    ];

    const aiAdvice = await callGroqAI(messages);

    return NextResponse.json({
      coachName: "Gabi AI",
      advice:
        aiAdvice ||
        "💡 **Conseil de Gabi AI :** La spontanéité est la meilleure clé ! Ne tarde pas trop avant d'envoyer une note vocale ou de proposer un date.",
    });
  } catch (error) {
    console.error("Gabi AI error:", error);
    return NextResponse.json({ error: "Erreur Gabi AI" }, { status: 500 });
  }
}
