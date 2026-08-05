import { db } from "@/db";
import { users, referrals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * 🎁 Génère un code de parrainage unique
 * Format : PRÉNOM + 4 chiffres aléatoires
 * Ex: "GABRIEL1234", "MARIE5678"
 */
export async function generateUniqueReferralCode(firstName: string): Promise<string> {
  // Nettoyer le prénom : enlever accents, espaces, caractères spéciaux
  const cleanName = firstName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-zA-Z]/g, "") // Garder seulement les lettres
    .toUpperCase()
    .substring(0, 8); // Max 8 caractères pour laisser de la place aux chiffres

  const baseName = cleanName || "USER"; // Fallback si prénom vide

  // Essayer jusqu'à 10 fois de trouver un code unique
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
    const code = `${baseName}${randomDigits}`;

    // Vérifier si le code existe déjà
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (existing.length === 0) {
      return code; // Code unique trouvé !
    }
  }

  // Fallback : timestamp si vraiment tous les codes sont pris
  return `${baseName}${Date.now().toString().slice(-6)}`;
}

/**
 * 🎁 Applique le parrainage : 7 jours de Premium au parrain ET au filleul
 */
export async function applyReferralReward(
  referrerId: number,
  referredUserId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que ce n'est pas le même user (auto-parrainage impossible)
    if (referrerId === referredUserId) {
      return { success: false, error: "Auto-parrainage impossible" };
    }

    // Vérifier si ce parrainage existe déjà (évite double récompense)
    const existingReferral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, referredUserId))
      .limit(1);

    if (existingReferral.length > 0) {
      return { success: false, error: "Parrainage déjà appliqué" };
    }

    // Récupérer les 2 users
    const [referrer, referredUser] = await Promise.all([
      db.select().from(users).where(eq(users.id, referrerId)).limit(1),
      db.select().from(users).where(eq(users.id, referredUserId)).limit(1),
    ]);

    if (referrer.length === 0 || referredUser.length === 0) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    const referrerData = referrer[0];
    const referredData = referredUser[0];

    // Calculer les nouvelles dates d'expiration Premium (+7 jours)
    const now = new Date();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    // Pour le parrain : ajouter 7 jours à sa date actuelle (ou now si pas Premium)
    const referrerCurrentExpiry = referrerData.premiumExpiresAt 
      ? new Date(referrerData.premiumExpiresAt) 
      : now;
    const referrerBaseDate = referrerCurrentExpiry > now ? referrerCurrentExpiry : now;
    const referrerNewExpiry = new Date(referrerBaseDate.getTime() + SEVEN_DAYS);

    // Pour le filleul : 7 jours à partir de maintenant
    const referredCurrentExpiry = referredData.premiumExpiresAt 
      ? new Date(referredData.premiumExpiresAt) 
      : now;
    const referredBaseDate = referredCurrentExpiry > now ? referredCurrentExpiry : now;
    const referredNewExpiry = new Date(referredBaseDate.getTime() + SEVEN_DAYS);

    // Appliquer les récompenses en parallèle
    await Promise.all([
      // Mise à jour du parrain : +7j Premium + increment referralCount
      db
        .update(users)
        .set({
          isPremium: true,
          premiumExpiresAt: referrerNewExpiry,
          premiumPlan: referrerData.premiumPlan || "premium",
          referralCount: sql`${users.referralCount} + 1`,
        })
        .where(eq(users.id, referrerId)),

      // Mise à jour du filleul : +7j Premium
      db
        .update(users)
        .set({
          isPremium: true,
          premiumExpiresAt: referredNewExpiry,
          premiumPlan: "premium",
        })
        .where(eq(users.id, referredUserId)),

      // Enregistrer dans l'historique des parrainages
      db.insert(referrals).values({
        referrerId: referrerId,
        referredUserId: referredUserId,
        rewardApplied: true,
        rewardType: "premium_7d",
      }),
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Erreur applyReferralReward:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 🔍 Trouve un user par son code de parrainage
 */
export async function findUserByReferralCode(code: string) {
  if (!code || code.trim() === "") return null;

  const cleanCode = code.trim().toUpperCase();

  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      referralCode: users.referralCode,
    })
    .from(users)
    .where(eq(users.referralCode, cleanCode))
    .limit(1);

  return result[0] || null;
}

/**
 * 📊 Récupère les stats de parrainage d'un user
 */
export async function getReferralStats(userId: number) {
  // Récupérer le user avec son code
  const user = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      referralCode: users.referralCode,
      referralCount: users.referralCount,
      premiumExpiresAt: users.premiumExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) return null;

  // Récupérer la liste des filleuls
  const filleuls = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      photoUrl: users.photoUrl,
      createdAt: users.createdAt,
    })
    .from(referrals)
    .innerJoin(users, eq(users.id, referrals.referredUserId))
    .where(eq(referrals.referrerId, userId));

  // Calculer les jours de Premium gagnés
  const premiumDaysEarned = (user[0].referralCount || 0) * 7;

  return {
    referralCode: user[0].referralCode,
    referralCount: user[0].referralCount || 0,
    premiumDaysEarned,
    premiumExpiresAt: user[0].premiumExpiresAt,
    filleuls,
  };
}
