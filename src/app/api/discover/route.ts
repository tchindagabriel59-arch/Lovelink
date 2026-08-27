import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes } from "@/db/schema";
import { eq, and, notInArray, ne, sql, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Charger les préférences de l'utilisateur actuel
    const [currentUser] = await db
      .select({
        id: users.id,
        prefGender: users.prefGender,
        prefAgeMin: users.prefAgeMin,
        prefAgeMax: users.prefAgeMax,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 2. Récupérer TOUS les ID des personnes déjà likées ou passées (Pour ne plus les voir)
    const interactedRecords = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const interactedIds = interactedRecords.map((record) => record.toUserId);
    // On ajoute son propre ID pour ne pas se voir soi-même
    interactedIds.push(userId); 

    // 3. Lire le filtre demandé par le frontend (Nouveaux, Premium, En ligne, etc.)
    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all";

    // 4. Construire la requête SQL dynamiquement et de façon OPTIMISÉE
    const conditions = [
      notInArray(users.id, interactedIds), // Exclure les gens déjà vus
      ne(users.isBanned, true),            // Exclure les bannis
    ];

    // Appliquer le filtre de genre si ce n'est pas "all"
    if (currentUser.prefGender && currentUser.prefGender !== "all") {
      conditions.push(eq(users.gender, currentUser.prefGender));
    }

    // Appliquer les filtres spécifiques du menu
    if (filter === "verified") {
      conditions.push(eq(users.isVerified, true));
    } else if (filter === "online") {
      conditions.push(eq(users.isOnline, true));
    } else if (filter === "premium") {
      conditions.push(eq(users.isPremium, true));
    } else if (filter === "new") {
      // Les inscrits des 7 derniers jours
      conditions.push(sql`${users.createdAt} > NOW() - INTERVAL '7 days'`);
    }

    // 5. Exécuter la requête optimisée (Limité à 15 profils pour économiser le CPU Neon)
    const discoverProfiles = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        birthDate: users.birthDate,
        gender: users.gender,
        bio: users.bio,
        city: users.city,
        country: users.country,
        photoUrl: users.photoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        interests: users.interests,
        occupation: users.occupation,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        isPremium: users.isPremium,
        isVerified: users.isVerified,
        isBoosted: users.isBoosted,
        boostExpiresAt: users.boostExpiresAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(
        // Priorité 1 : Les profils BOOSTÉS (Si le boost n'est pas expiré)
        sql`CASE WHEN ${users.isBoosted} = true AND ${users.boostExpiresAt} > NOW() THEN 1 ELSE 0 END DESC`,
        // Priorité 2 : Les profils en ligne récemment
        desc(users.lastSeen)
      )
      .limit(15); // 👈 15 max à la fois pour la vitesse !

    // 6. Vérifier qui m'a déjà liké (Pour afficher le badge "T'a liké")
    const myReceivedLikes = await db
      .select({ fromUserId: likes.fromUserId, isSuperLike: likes.isSuperLike })
      .from(likes)
      .where(eq(likes.toUserId, userId));

    const finalProfiles = discoverProfiles.map((p) => {
      const receivedLike = myReceivedLikes.find((l) => l.fromUserId === p.id);
      
      return {
        ...p,
        hasLikedMe: !!receivedLike,
        hasSuperLikedMe: receivedLike?.isSuperLike || false,
        // Sécurité : On masque les photos 1 à 4 si l'utilisateur actuel n'est PAS premium
        photo1Url: currentUser.isPremium ? p.photo1Url : null,
        photo2Url: currentUser.isPremium ? p.photo2Url : null,
        photo3Url: currentUser.isPremium ? p.photo3Url : null,
        photo4Url: currentUser.isPremium ? p.photo4Url : null,
      };
    });

    return NextResponse.json({ profiles: finalProfiles });
  } catch (error) {
    console.error("Erreur API Discover:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
