import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetName, targetCity, interests, userGender } = body as {
      action: "bio" | "icebreaker" | "advice";
      targetName?: string;
      targetCity?: string;
      interests?: string[];
      userGender?: string;
    };

    // 1. GÉNÉRATEUR DE PHRASES D'ACCROCHE (CHAT / MESSAGE DIRECT)
    if (action === "icebreaker") {
      const name = targetName || "la personne";
      const city = targetCity || "ta ville";

      const icebreakers = [
        `Salut ${name} ! J'ai vu que tu es à ${city}. C'est quoi ton endroit préféré pour un bon verre au calme ? 😊`,
        `Coucou ${name} ! À part illuminer LoveLink avec ton sourire, tu fais quoi de beau dans la vie ? ✨`,
        `Franchement ${name}, ton profil m'a direct tapé dans l'œil ! Si on devait organiser notre premier date idéal, tu choisirais quoi ? 🍕☕`,
        `Salut ${name} ! On parie que j'arrive à te faire sourire en moins de 3 messages ? 😉`,
      ];

      // Sélection aléatoire de 3 accroches
      const shuffled = icebreakers.sort(() => 0.5 - Math.random());
      return NextResponse.json({ suggestions: shuffled.slice(0, 3) });
    }

    // 2. GÉNÉRATEUR DE BIOS AUTOMATIQUES (PROFIL)
    if (action === "bio") {
      const isMale = userGender === "male";
      const cityText = targetCity ? ` Basé(e) à ${targetCity}.` : "";

      const maleBios = [
        `Ici pour faire de vraies belles rencontres. Passionné par la vie, les bons moments et les discussions sincères.${cityText} Faisons connaissance ! ✨`,
        `Un bon équilibre entre ambition, humour et simplicité. On se capte autour d'un verre ? ☕😊`,
        `Si tu aimes rire, voyager et partager de bons plats, on risque de très bien s'entendre. 😉`,
      ];

      const femaleBios = [
        `Simple, pétillante et avec un grand cœur.${cityText} À la recherche d'une belle complicité, sans prise de tête. 💕`,
        `Souriante au quotidien, j'aime les petites attentions et les belles conversations. Et toi, c'est quoi ton histoire ? ✨`,
        `Une touche d'humour, une bonne dose de positivité. Viens me dire bonjour ! 😊`,
      ];

      const bios = isMale ? maleBios : femaleBios;
      const randomBio = bios[Math.floor(Math.random() * bios.length)];

      return NextResponse.json({ bio: randomBio });
    }

    // 3. CONSEILS DU COACH
    const adviceList = [
      "💡 **Conseil du Coach :** Évite le simple 'Salut ça va ?'. Pose plutôt une question sur une de ses photos ou sa ville !",
      "💡 **Conseil du Coach :** L'humour et la légèreté sont les meilleures clés pour lancer une discussion captivante.",
      "💡 **Conseil du Coach :** N'attends pas 2 semaines pour proposer un appel vocal ou un verre. La spontanéité est séduisante !",
    ];

    const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
    return NextResponse.json({ advice: randomAdvice });

  } catch (error) {
    console.error("AI Coach error:", error);
    return NextResponse.json({ error: "Erreur serveur AI Coach" }, { status: 500 });
  }
}
