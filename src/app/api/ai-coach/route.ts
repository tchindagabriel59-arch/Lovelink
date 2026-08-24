import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetName, targetCity, userGender } = body as {
      action: "bio" | "icebreaker" | "advice";
      targetName?: string;
      targetCity?: string;
      userGender?: string;
    };

    const name = targetName?.trim() || "la personne";
    const city = targetCity?.trim() || "ta ville";

    // 1. 💬 SUGGESTIONS D'ACCROCHE DÉCONTRACTÉES PAR Gabi  AI
    if (action === "icebreaker") {
      const icebreakers = [
        `Salut ${name} ! J'ai vu que tu es à ${city}. C'est quoi ton coin préféré pour prendre un bon verre tranquilement ? 😊`,
        `Coucou ${name} ! Ton sourire sur ta photo m'a direct tapé dans l'œil ! Tu fais quoi de beau aujourd'hui ? ✨`,
        `Salut ${name} ! Si on devait organiser notre premier date idéal à ${city}, tu choisirais quoi : resto, glace ou balade ? 🍕🍦`,
        `Franchement ${name}, ton profil a trop de charme. On parie que j'arrive à te faire rire en moins de 3 messages ? 😉`,
      ];

      // Choisir 3 suggestions aléatoires
      const shuffled = icebreakers.sort(() => 0.5 - Math.random());
      return NextResponse.json({
        coachName: "Gabi  AI",
        suggestions: shuffled.slice(0, 3)
      });
    }

    // 2. 🪄 GÉNÉRATEUR DE BIO IRRESTISTIBLE PAR Gabi  AI
    if (action === "bio") {
      const isMale = userGender === "male";
      const maleBios = [
        `Un bon équilibre entre ambition, humour et simplicité. Basé à ${city}, j'aime les discussions vraies et les bons moments. On se capte autour d'un verre ? ☕✨`,
        `Souriant, passionné et respectueux. Ici pour faire une belle rencontre sincère. Si tu aimes rire et partager de bons plats, fais-moi signe ! 😊`,
      ];

      const femaleBios = [
        `Simple, pétillante et avec une bonne dose de positivité. Basée à ${city}, je cherche une belle complicité sincère, sans prise de tête. 💕`,
        `Une touche d'humour, un grand cœur et de beaux projets. Viens me dire bonjour, je ne mords pas ! 😉✨`,
      ];

      const bios = isMale ? maleBios : femaleBios;
      const randomBio = bios[Math.floor(Math.random() * bios.length)];

      return NextResponse.json({
        coachName: "Gabi  AI",
        bio: randomBio
      });
    }

    // 3. 💡 CONSEILS DE DRAGUE PAR Gabi  AI
    const adviceList = [
      "💡 **Conseil de Gabi  AI :** Évite le simple 'Cc ça va ?'. Relance sur sa ville ou sa photo pour te démarquer !",
      "💡 **Conseil de Gabi  AI :** L'humour et la politesse sont tes meilleurs atouts pour obtenir une réponse rapide.",
      "💡 **Conseil de Gabi  AI :** N'attends pas 2 semaines ! Propose un vocal ou un appel court dès que le feeling passe bien.",
    ];

    const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
    return NextResponse.json({
      coachName: "Gabi  AI",
      advice: randomAdvice
    });

  } catch (error) {
    console.error("Gabi  AI error:", error);
    return NextResponse.json({ error: "Erreur Gabi  AI" }, { status: 500 });
  }
}
