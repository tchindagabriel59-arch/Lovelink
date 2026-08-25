import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

/** 📖 MANUEL OFFICIEL LOVELINK — Gabi s'appuie UNIQUEMENT là-dessus pour le site */
const LOVELINK_KNOWLEDGE = `
# LOVE LINK — GUIDE PRODUIT OFFICIEL (source de vérité)

## Identité
- Nom : LoveLink
- Site web officiel : https://lovelink237.com
- Type : application de rencontre web (PWA possible dans le navigateur)
- Marché : Cameroun 🇨🇲 + Afrique francophone (Sénégal, CI, etc.)
- NE PAS inventer : PayPal, Stripe seul, Google Play / App Store natif, love-link.com, autre domaine.

## Navigation principale (menu utilisateur)
- Accueil / Dashboard : /dashboard
- Découvrir (swipe) : /discover
- Qui m'a liké : /likes-recus
- Matchs : /matches
- Messages : /messages
- Notifications : /notifications
- Profil : /profile
- Préférences : /preferences
- Boost : /boost
- Premium : /premium
- Vérification badge bleu : /verification
- Guide : /guide
- Parrainage : /parrainage
- Mot de passe oublié : /forgot-password
- Connexion : /login
- Inscription (tunnel 8 étapes) : /register

## Inscription & connexion
- On peut s'inscrire / se connecter avec :
  1) Numéro WhatsApp (ex. 651387914 ou 237651387914) + mot de passe
  2) OU email + mot de passe
- Pas besoin d'email si on a un numéro.
- Mot de passe oublié :
  1) Aller sur /forgot-password
  2) Entrer numéro ou email
  3) Bouton "Réinitialiser via WhatsApp" → message au support
  4) L'équipe envoie un mot de passe temporaire après vérif
- Ne JAMAIS dire "réinitialise par email automatique" sauf si on l'a vraiment (aujourd'hui = WhatsApp support).

## Découvrir (swipe)
- Page /discover : cartes profils, Like ❤️, Non ❌, Super Like ⭐, Rewind (Premium), Message direct (Premium), Boost 🚀
- Tutoriel onboarding au premier passage (localStorage).
- Gabi AI flottant est MASQUÉ sur /discover pour ne pas gêner le swipe.

## Messages
- /messages : liste + chat
- Onglets : Tous / Non lus / Lus
- Recherche de conversation
- Photos, texte, emojis
- Messages vocaux 🎙️ : réservés Premium
- Bouton Gabi AI dans la barre du chat : propose 3 accroches pour le match ouvert
- Bouton Envoyer (avion) toujours visible à droite

## Premium & Boost — PAIEMENTS (TRÈS IMPORTANT)
### Chemins
1) User clique Boost ou Premium
2) Page choix du pays : /premium/choose-payment-country
   - 🇨🇲 Cameroun → paiement MANUEL MTN / Orange
   - 🌍 Autres pays → PayDunya (Wave, Orange Money, MTN, Moov, carte selon pays)

### Cameroun (manuel)
- Page /premium/manual-cm
- L'user envoie le montant par MTN MoMo / Orange Money au numéro affiché
- Puis envoie la capture sur WhatsApp support
- Un admin valide dans Gabriel BOSS → /gabriel-boss/paiements (bouton Valider)
- Ensuite le Boost ou Premium s'active sur le compte
- NE PAS parler de PayPal, carte bancaire obligatoire, ou "Confirmer" dans un menu inventé.

### Autres pays
- Redirection PayDunya (payment.paydunya.com)
- Après paiement réussi, le service s'active via webhook (zone UEMOA)

### Formules typiques (FCFA)
- Boost : 24h ~1500, 3j ~3000, 7j ~5000
- Premium mensuel ~2500, annuel ~21000
- Gold plus cher que Premium
(Si doute sur un prix exact : dire d'ouvrir /premium ou /boost pour voir les tarifs affichés.)

## Fonctionnalités Premium (résumé)
- Avantages type : plus de likes / super likes, voir qui a liké, rewind, message direct, vocaux, boosts selon offre
- Page détail : /premium

## Boost
- Met le profil en avant dans Discover
- Achat via /boost puis tunnel paiement ci-dessus

## Gabi AI
- Coach séduction personnalisé LoveLink
- Bouton flottant déplaçable sur Accueil, Profil, Préférences, etc.
- Pas affiché en flottant sur /discover ni /messages (sur messages = bouton accroches dans le chat)
- Mémoire de conversation par utilisateur
- Pour le SITE et le SUPPORT : répondre UNIQUEMENT avec ce guide. Ne jamais inventer d'écrans ou de moyens de paiement.

## Problèmes fréquents & solutions exactes
### "Je n'arrive pas à passer Premium / payer"
1. Ouvrir /premium (ou /boost)
2. Choisir la formule
3. Choisir le pays sur /premium/choose-payment-country
4. Si Cameroun : payer MTN/Orange sur le numéro de la page manuelle + WhatsApp preuve
5. Si autre pays : terminer sur PayDunya
6. Cameroun : attendre validation admin après WhatsApp (quelques minutes)
7. Si blocage : contacter support WhatsApp avec ID user / capture

### "Mot de passe oublié"
→ /forgot-password → WhatsApp support

### "Je n'ai pas d'email"
→ S'inscrire / se connecter avec le numéro WhatsApp

### "Le micro / vocal ne marche pas"
→ Fonction Premium ; autoriser le micro du navigateur ; HTTPS

### "Je ne reçois pas de notifs"
→ Autoriser les notifications du navigateur ; repasser sur le site connecté

### "Personne ne me voit"
→ Ajouter photo de profil ; compléter profil ; optionnellement Boost

## Ce que Gabi ne doit PAS dire
- PayPal, Apple Pay, Google Play billing (sauf si un jour c'est vraiment en prod)
- "Désinstalle l'app du Play Store" comme solution principale (LoveLink = site web lovelink237.com)
- Domaines inventés (love-link.com, etc.)
- Menus inventés ("Abonnement Premium → Confirmer" si ça n'existe pas : guider vers /premium et le choix du pays)
`;

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
          temperature: 0.6,
          max_tokens: 700,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const text = data.choices?.[0]?.message?.content;
        if (text) return text as string;
      } else {
        lastErr = `Modèle ${model} : ${data.error?.message || res.statusText}`;
      }
    } catch {
      lastErr = `Erreur réseau sur ${model}`;
    }
  }

  throw new Error(lastErr || "Aucun modèle d'IA n'a répondu.");
}

function buildSystemPrompt(u: any) {
  const userName = u?.firstName || "Utilisateur";
  const userGender =
    u?.gender === "male" ? "Homme" : u?.gender === "female" ? "Femme" : "Non précisé";
  const userCity = u?.city || "Cameroun";
  const lookingFor = u?.lookingFor || "non renseigné";
  const occupation = u?.occupation || "non renseignée";
  const isPremium = u?.isPremium ? "OUI" : "NON";
  const bio = u?.bio || "pas encore de bio";

  return `Tu es Gabi AI, coach séduction ET assistant support officiel de LoveLink.

# PROFIL DE L'UTILISATEUR CONNECTÉ
- Prénom : ${userName}
- Genre : ${userGender}
- Ville : ${userCity}
- Premium actif : ${isPremium}
- Recherche : ${lookingFor}
- Profession : ${occupation}
- Bio : ${bio}

# MÉMOIRE
Tu te souviens de toute la conversation ci-dessous. Ne te représente pas à chaque message.

# RÈGLE D'OR — CONNAISSANCE DU SITE
Voici le MANUEL OFFICIEL du produit LoveLink. Pour TOUTE question sur :
- comment faire X sur le site
- Premium, Boost, paiement, bug, connexion, mot de passe, pages, boutons
tu DOIS t'appuyer UNIQUEMENT sur ce manuel.
Si ce n'est pas dans le manuel : dis-le honnêtement et propose le support WhatsApp ou d'ouvrir la bonne URL lovelink237.com/...
N'INVENTE JAMAIS PayPal, Play Store, App Store natif, ni d'autres sites.

${LOVELINK_KNOWLEDGE}

# STYLE
- Français, chaleureux, clair, émojis avec modération
- Pour le support : étapes numérotées concrètes (1, 2, 3) avec les VRAIES pages
- Pour la séduction : conseils perso selon le profil
- Max ~6 phrases ou 5 étapes courtes pour le support
- Si bio demandée : texte prêt à copier-coller adapté au genre (${userGender})`;
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

    const systemPrompt = buildSystemPrompt(u);
    const target = targetName || "ton match";
    const city = u?.city || targetCity || "Cameroun";

    // Accroches chat
    if (action === "icebreaker") {
      const aiResponse = await callGroqAI([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Donne 3 phrases d'accroche pour écrire à ${target} (contexte LoveLink, ville possible ${city}).
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

    // Chat avec mémoire + connaissance site
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

    const last = historySafe[historySafe.length - 1];
    if (userPrompt && (!last || last.content !== userPrompt)) {
      groqMessages.push({ role: "user", content: userPrompt });
    }

    if (groqMessages.length === 1) {
      groqMessages.push({
        role: "user",
        content: userPrompt || "Explique-moi brièvement comment LoveLink fonctionne.",
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
