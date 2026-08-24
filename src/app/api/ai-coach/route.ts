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

// 🧠 FALLBACK INTELLIGENT (Si Groq n'est pas encore configuré)
function getSmartFallback(prompt: string, userGender?: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("bio") || p.includes("biographie") || p.includes("présentation")) {
    return userGender === "male"
      ? "✨ **Idée de Bio par Gabi AI :**\nUn bon équilibre entre ambition, humour et simplicité. Basé au Cameroun, j'aime les discussions vraies et les bons moments. On se capte autour d'un verre ? ☕😊"
      : "✨ **Idée de Bio par Gabi AI :**\nSimple, pétillante et avec une bonne dose de positivité. Je cherche une belle complicité sincère, sans prise de tête. Viens me dire bonjour ! 💕";
  }

  if (p.includes("accroche") || p.includes("premier message") || p.includes("drague")) {
    return "💡 **Conseil d'accroche par Gabi AI :**\nEssaye ceci : *'Salut ! J'ai vu ta photo, ton sourire m'a direct tapé dans l'œil ! C'est quoi ton endroit préféré pour prendre un verre au calme ? 😊'*";
  }

  if (p.includes("date") || p.includes("rencontre") || p.includes("resto")) {
    return "📍 **Conseil premier Date par Gabi AI :**\nChoisis un endroit neutre et chaleureux (un bon salon de thé ou un lounge calme). L'objectif est de pouvoir discuter sans devoir hurler à cause de la musique ! ☕🍹";
  }

  return "💡 **Conseil de Gabi AI :**\nLa clé sur LoveLink, c'est la spontanéité et le respect. N'hésite pas à envoyer une note vocale pour créer une vraie connexion ! 🎙️✨";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetName, targetCity, userGender, userPrompt } = body as {
      action?: "bio" | "icebreaker" | "advice" | "chat";
      targetName?: string;
      targetCity?: string;
      userGender?: string;
      userPrompt?: string;
    };

    const promptText = userPrompt || "";
    const name = targetName?.trim() || "la personne";
    const city = targetCity?.trim() || "Cameroun";

    const systemPrompt = `Tu es Gabi AI, le coach virtuel officiel en séduction de l'application de rencontre LoveLink au Cameroun et en Afrique francophone.
Ton rôle est de donner des conseils de drague drôles, bienveillants, polis et ultra efficaces adaptés à la culture locale (Yaoundé, Douala, Dakar, Abidjan).
Si l'utilisateur te demande une biographie, rédige-lui une super biographie prête à copier-coller.
Réponds en français, avec un ton dynamique, chaleureux et complice (utilise des émojis). Sois concis (maximum 3 phrases courtes).`;

    // 💬 1. CHAT LIBRE AVEC L'IA
    if (action === "chat" || promptText) {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText || "Donne-moi un conseil de drague rapide." },
      ];

      const aiResponse = await callGroqAI(messages);

      if (aiResponse) {
        return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });
      }

      // Fallback si pas de clé Groq
      return NextResponse.json({
        coachName: "Gabi AI",
        advice: getSmartFallback(promptText, userGender),
      });
    }

    // 💬 2. ACCROCHES MESSAGERIE
    if (action === "icebreaker") {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Propose-moi 3 phrases d'accroche originales pour engager la conversation avec ${name} à ${city}. Renvoie uniquement les 3 phrases séparées par une ligne.`,
        },
      ];

      const aiResponse = await callGroqAI(messages);

      if (aiResponse) {
        const suggestions = aiResponse
          .split("\n")
          .map((s: string) => s.replace(/^[0-9.-]+\s*/, "").trim())
          .filter((s: string) => s.length > 5)
          .slice(0, 3);

        if (suggestions.length > 0) {
          return NextResponse.json({ coachName: "Gabi AI", suggestions });
        }
      }

      const fallbackSuggestions = [
        `Salut ${name} ! J'ai vu que tu es à ${city}. C'est quoi ton endroit préféré pour prendre un verre au calme ? 😊`,
        `Coucou ${name} ! Ton profil m'a direct fait sourire ! Tu fais quoi de beau dans la vie ? ✨`,
        `Salut ${name} ! Si on devait organiser notre premier date idéal, tu choisirais quoi ? 🍕☕`,
      ];
      return NextResponse.json({ coachName: "Gabi AI", suggestions: fallbackSuggestions });
    }

    // 💡 3. PAR DÉFAUT
    return NextResponse.json({
      coachName: "Gabi AI",
      advice: getSmartFallback(promptText, userGender),
    });

  } catch (error) {
    console.error("Gabi AI error:", error);
    return NextResponse.json({ error: "Erreur Gabi AI" }, { status: 500 });
  }
}
