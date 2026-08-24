import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function callGroqAI(messages: { role: string; content: string }[]) {
  if (!GROQ_API_KEY) return null;

  // Liste des modèles ACTUELS et VALIDES sur Groq (Mise à jour 2024/2025)
  // On utilise les nouveaux modèles recommandés par Groq
  const activeModels = [
    "llama-3.3-70b-versatile", // Le plus puissant (équivalent 120B OSS)
    "llama-3.1-70b-versatile", // Très stable
    "mixtral-8x7b-32768",       // Excellent en français
    "llama-3.1-8b-instant"      // Le plus rapide
  ];

  for (const model of activeModels) {
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
          temperature: 0.8,
          max_tokens: 400,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err) {
      console.error(`Erreur avec le modèle ${model}:`, err);
    }
  }
  return null;
}

// 🧠 GÉNÉRATEUR DE RÉPONSE MANUELLE (Si l'IA est hors-ligne)
function getSmartFallback(prompt: string, userGender: string): string {
  const p = prompt.toLowerCase().trim();
  const isMale = userGender === "male" || p.includes("homme") || p.includes("garçon");

  if (p.includes("bio") || p.includes("biographie") || p.includes("présentation")) {
    if (isMale) {
      return "✨ **Idée de Bio (Homme) :**\nEntrepreneur passionné, j'aime autant les soirées tranquilles que les aventures imprévues. Basé à Douala, je cherche une femme authentique avec qui partager de bons moments et peut-être plus. On se capte ? ☕✨";
    } else {
      return "✨ **Idée de Bio (Femme) :**\nSimple, pétillante et avec un grand cœur. J'aime les discussions vraies, la bonne cuisine et les voyages. Je cherche un homme respectueux pour construire une belle complicité. Viens me dire bonjour ! 💕";
    }
  }

  if (p.includes("trouver") || p.includes("bonne personne") || p.includes("rencontre")) {
    return "💡 **Conseil de Gabi AI :** Pour trouver la perle rare, sois toi-même ! Complète ton profil à 100%, mets tes vraies passions et n'hésite pas à faire le premier pas avec humour. La sincérité est ce qui attire le plus ici. 😉";
  }

  return "Salut ! 👋 Je suis Gabi AI. Je peux t'aider à rédiger ta bio, te donner des idées de messages ou des conseils pour tes rendez-vous. Pose-moi ta question ! ✨";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { action, targetName, targetCity, userGender, userPrompt } = body as {
      action?: string;
      targetName?: string;
      targetCity?: string;
      userGender?: string;
      userPrompt?: string;
    };

    const promptText = userPrompt || "";
    // On détecte le genre pour éviter de donner une bio de femme à un homme
    const detectedGender = userGender || (promptText.toLowerCase().includes("je suis un homme") ? "male" : "female");

    const systemPrompt = `Tu es Gabi AI, le coach virtuel officiel de LoveLink. 
Tu aides les célibataires en Afrique (Cameroun, Sénégal, Côte d'Ivoire...) à séduire avec classe, humour et respect.
Si l'utilisateur est un homme (Gabriel, etc.), utilise des formules masculines.
Si c'est une femme, utilise des formules féminines.
Sois chaleureux, utilise des émojis et réponds en maximum 3-4 phrases.`;

    // 💬 CHAT AVEC GABI AI
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: promptText || "Donne-moi un conseil de drague." }
    ];

    const aiResponse = await callGroqAI(messages);

    if (aiResponse) {
      return NextResponse.json({ coachName: "Gabi AI", advice: aiResponse });
    }

    // 🔄 FALLBACK SI L'API GROQ ÉCHOUE
    return NextResponse.json({
      coachName: "Gabi AI",
      advice: getSmartFallback(promptText, detectedGender),
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur Gabi AI" }, { status: 500 });
  }
}
