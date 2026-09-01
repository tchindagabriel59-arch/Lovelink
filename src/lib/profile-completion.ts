// src/lib/profile-completion.ts
// Score de complétion profil LoveLink (style Badoo)

export interface ProfileForCompletion {
  photoUrl?: string | null;
  photo1Url?: string | null;
  photo2Url?: string | null;
  photo3Url?: string | null;
  photo4Url?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  occupation?: string | null;
  interests?: string | null;
  birthDate?: string | Date | null;
  isVerified?: boolean | null;
}

export type MissingKey =
  | "photoMain"
  | "photosExtra"
  | "bio"
  | "city"
  | "occupation"
  | "interests"
  | "birthDate"
  | "verified";

export interface MissingItem {
  key: MissingKey;
  label: string;
  description: string;
  points: number;
  cta: string;
  href: string;
  priority: number;
  emoji: string;
}

export interface CompletionResult {
  percent: number;
  totalPoints: number;
  earnedPoints: number;
  missing: MissingItem[];
  nextAction: MissingItem | null;
  level: "low" | "medium" | "high" | "complete";
  message: string;
}

export function calculateProfileCompletion(
  profile: ProfileForCompletion
): CompletionResult {
  let earnedPoints = 0;
  const missing: MissingItem[] = [];

  // 1. Photo principale (25)
  const hasMainPhoto =
    !!profile.photoUrl && profile.photoUrl.trim().length > 5;
  if (hasMainPhoto) {
    earnedPoints += 25;
  } else {
    missing.push({
      key: "photoMain",
      label: "Ajoute ta meilleure photo",
      description:
        "Les profils avec photo reçoivent 10× plus de likes. C'est indispensable.",
      points: 25,
      cta: "Ajouter une photo",
      href: "/complete-profile",
      priority: 1,
      emoji: "📸",
    });
  }

  // 2. Photos extra (15 max)
  const extraPhotos = [
    profile.photo1Url,
    profile.photo2Url,
    profile.photo3Url,
    profile.photo4Url,
  ].filter((p) => !!p && p.trim().length > 5);
  const extraCount = Math.min(extraPhotos.length, 3);
  earnedPoints += extraCount * 5;
  if (extraCount < 3) {
    const need = 3 - extraCount;
    missing.push({
      key: "photosExtra",
      label: `Ajoute ${need} photo${need > 1 ? "s" : ""} de plus`,
      description: "Les profils avec 3+ photos matchent 3× plus.",
      points: need * 5,
      cta: "Ajouter des photos",
      href: "/complete-profile",
      priority: 2,
      emoji: "🖼️",
    });
  }

  // 3. Bio (15)
  const hasBio = !!profile.bio && profile.bio.trim().length >= 20;
  if (hasBio) {
    earnedPoints += 15;
  } else {
    missing.push({
      key: "bio",
      label: "Écris une bio percutante",
      description:
        "En 2 phrases, montre ta personnalité. Les bios attirent 5× plus.",
      points: 15,
      cta: "Écrire ma bio",
      href: "/complete-profile",
      priority: 3,
      emoji: "✍️",
    });
  }

  // 4. Ville (10)
  const hasCity = !!profile.city && profile.city.trim().length >= 2;
  if (hasCity) {
    earnedPoints += 10;
  } else {
    missing.push({
      key: "city",
      label: "Indique ta ville",
      description: "Pour être vu par les célibataires près de toi.",
      points: 10,
      cta: "Ajouter ma ville",
      href: "/complete-profile",
      priority: 4,
      emoji: "📍",
    });
  }

  // 5. Intérêts (12)
  const interestsCount = profile.interests
    ? profile.interests.split(",").filter((i) => i.trim().length > 0).length
    : 0;
  if (interestsCount >= 3) {
    earnedPoints += 12;
  } else {
    const need = Math.max(1, 3 - interestsCount);
    missing.push({
      key: "interests",
      label: `Ajoute ${need} centre${need > 1 ? "s" : ""} d'intérêt`,
      description: "Ça facilite les premiers messages et brise la glace.",
      points: 12,
      cta: "Ajouter mes intérêts",
      href: "/complete-profile",
      priority: 5,
      emoji: "🎯",
    });
  }

  // 6. Occupation (8)
  const hasOccupation =
    !!profile.occupation && profile.occupation.trim().length >= 2;
  if (hasOccupation) {
    earnedPoints += 8;
  } else {
    missing.push({
      key: "occupation",
      label: "Ajoute ton métier ou tes études",
      description: "Ça donne du contexte et rassure.",
      points: 8,
      cta: "Ajouter mon métier",
      href: "/complete-profile",
      priority: 6,
      emoji: "💼",
    });
  }

  // 7. Date de naissance (si manquante)
  if (!profile.birthDate) {
    missing.push({
      key: "birthDate",
      label: "Renseigne ta date de naissance",
      description: "Obligatoire pour finaliser ton profil.",
      points: 0,
      cta: "Compléter mon profil",
      href: "/complete-profile",
      priority: 0,
      emoji: "🎂",
    });
  }

  // 8. Vérification (15)
  if (profile.isVerified) {
    earnedPoints += 15;
  } else {
    missing.push({
      key: "verified",
      label: "Fais vérifier ton profil",
      description:
        "Badge bleu de confiance. Les profils vérifiés matchent 4× plus.",
      points: 15,
      cta: "Vérifier mon profil",
      href: "/verification",
      priority: 7,
      emoji: "✅",
    });
  }

  const totalPoints = 100;
  const percent = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));

  missing.sort((a, b) => a.priority - b.priority);
  const nextAction = missing.length > 0 ? missing[0] : null;

  let level: CompletionResult["level"] = "low";
  let message =
    "⚡ Attention : profil incomplet. Tu passes à côté de beaucoup de matchs !";

  if (percent >= 100) {
    level = "complete";
    message = "🔥 Ton profil est PARFAIT ! Tu vas cartonner sur LoveLink.";
  } else if (percent >= 70) {
    level = "high";
    message = "🚀 Excellent ! Encore un petit effort pour maximiser tes matchs.";
  } else if (percent >= 40) {
    level = "medium";
    message = "💪 Bien parti ! Complète ton profil pour multiplier tes matchs.";
  }

  return {
    percent,
    totalPoints,
    earnedPoints,
    missing,
    nextAction,
    level,
    message,
  };
}
