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
          temperature: 0.75,
          max_tokens: 600,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const text = data.choices?.[0]?.message?.content;
        if (text) return text as string;
      } else {
        lastErr = `Modèle ${model} : ${data.error?.message || res.statusText}`;
      }
    } catch (e: unknown) {
      lastErr = `Erreur réseau sur ${model}`;
    }
  }

  throw new Error(lastErr || "Aucun modèle d'IA n'a répondu.");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const u = user as any;

    const body = await req.json();
    const {
      action,
      targetName,
      targetCity,
      userPrompt,
      history,
    } = body as {
      action?: string;
      targetName?: string;
      targetCity?: string;
      userPrompt?: string;
      history?: { role: string; content: string }[];
    };

    const userName = u?.firstName || "Utilisateur";
    const userGender =
      u?.gender === "male" ? "Homme" : u?.gender === "female" ? "Femme" : "Non précisé";
    const userCity = u?.city || targetCity || "Cameroun";
    const lookingFor = u?.lookingFor || "relation";
    const occupation = u?.occupation || "";
    const bio = u?.bio || "";

    const systemPrompt = `Tu es Gabi AI, le coach de séduction PERSONNEL de ${userName} sur LoveLink.

PROFIL DE ${userName.toUpperCase()} :
- Prénom : ${userName}
- Genre : ${userGender}
- Ville : ${userCity}
- Recherche : ${lookingFor}
- Profession : ${occupation || "non renseignée"}
- Bio actuelle : ${bio || "pas encore de bio"}

RÈGLES :
1. Tu te souviens de TOUTE la conversation ci-dessous. Ne redis pas "Salut je suis Gabi" à chaque message.
2. Adapte toujours tes conseils au genre (${userGender}) et à la ville (${userCity}).
3. Si on te demande une bio : rédige une bio unique, prête à copier-coller, pour un(e) ${userGender}.
4. Si on te demande une accroche : donne des phrases concrètes.
5. Sois chaleureux, drôle, direct, max 4 phrases, avec émojis.
6. Parle comme un vrai coach qui connaît déjà ${userName}, pas comme un bot générique.
7. Réponds toujours en français.`;

    // 🔑 Accroches messagerie
    if (action === "icebreaker") {
      const target = targetName || "ton match";
      const aiResponse = await callGroqAI([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Donne 3 phrases d'accroche pour écrire à ${target}.
Exactement 3 lignes, sans numéros, sans guillemets, sans intro.`,
        },
      ]);

      let suggestions = aiResponse
        .split("\n")
        .map((s: string) =>
          s
            .replace(/^[0-9.•\-\*]+\s*/, "")
            .replace(/^["«»]|["«»]$/g, "")
            .trim()
        )
        .filter((s: string) => s.length > 5)
        .slice(0, 3);

      if (suggestions.length < 1) {
        suggestions = [
          `Salut ${target} ! Ton profil m'a tout de suite parlé 😊`,
          `Coucou ${target} ! Ravi de matcher avec toi ✨`,
          `Salut ${target} ! Comment se passe ta journée ? 😉`,
        ];
      }

      return NextResponse.json({ coachName: "Gabi AI", suggestions });
    }

    // 🔑 Chat avec MÉMOIRE (historique client)
    const historySafe = Array.isArray(history)
      ? history
          .filter(
            (h) =>
              h &&
              (h.role === "user" || h.role === "assistant") &&
              typeof h.content === "string" &&
              h.content.trim().length > 0
          )
          .slice(-20)
      : [];

    const groqMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...historySafe,
    ];

    // Si history ne contient pas encore le dernier message user, l'ajouter
    const last = historySafe[historySafe.length - 1];
    if (userPrompt && (!last || last.content !== userPrompt)) {
      groqMessages.push({ role: "user", content: userPrompt });
    }

    if (groqMessages.length === 1) {
      groqMessages.push({
        role: "user",
        content: userPrompt || "Donne-moi un conseil de drague personnalisé.",
      });
    }

    const aiResponse = await callGroqAI(groqMessages);

    return NextResponse.json({
      coachName: "Gabi AI",
      advice: aiResponse,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur Gabi AI";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
