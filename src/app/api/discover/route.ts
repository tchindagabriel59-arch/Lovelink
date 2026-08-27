import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes } from "@/db/schema";
import { eq, and, notInArray, ne, sql, desc, or, isNull, gte, lte } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Préférences user actuel
    const [currentUser] = await db
      .select({
        id: users.id,
        prefGender: users.prefGender,
        prefAgeMin: users.prefAgeMin,
        prefAgeMax: users.prefAgeMax,
        isPremium: users.isPremium,
        birthDate: users.birthDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 2. Déjà likés / passés
    const interactedRecords = await db
      .select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const interactedIds = interactedRecords.map((r) => r.toUserId);
    // Toujours s'exclure soi-même
    if (!interactedIds.includes(userId)) {
      interactedIds.push(userId);
    }

    // 3. Filtre URL
    const filter = req.nextUrl.searchParams.get("filter") || "all";

    // 4. Conditions
    const conditions: any[] = [
      // Pas banni (null ou false OK)
      or(eq(users.isBanned, false), isNull(users.isBanned)),
      // Pas en mode incognito
      or(eq(users.isIncognito, false), isNull(users.isIncognito)),
    ];

    if (interactedIds.length > 0) {
      conditions.push(notInArray(users.id, interactedIds));
    }

    // Genre préféré
    if (currentUser.prefGender && currentUser.prefGender !== "all") {
      conditions.push(eq(users.gender, currentUser.prefGender as any));
    }

    // Âge (calcul SQL depuis birth_date YYYY-MM-DD)
    const ageMin = currentUser.prefAgeMin ?? 18;
    const ageMax = currentUser.prefAgeMax ?? 99;
    if (ageMin > 18 || ageMax < 99) {
      conditions.push(
        sql`EXTRACT(YEAR FROM AGE(CURRENT_DATE, TO_DATE(${users.birthDate}, 'YYYY-MM-DD'))) >= ${ageMin}`
      );
      conditions.push(
        sql`EXTRACT(YEAR FROM AGE(CURRENT_DATE, TO_DATE(${users.birthDate}, 'YYYY-MM-DD'))) <= ${ageMax}`
      );
    }

    // Filtres UI
    if (filter === "verified") {
      conditions.push(eq(users.isVerified, true));
    } else if (filter === "online") {
      conditions.push(eq(users.isOnline, true));
    } else if (filter === "premium") {
      conditions.push(eq(users.isPremium, true));
    } else if (filter === "new") {
      conditions.push(sql`${users.createdAt} > NOW() - INTERVAL '7 days'`);
    }

    // 5. Requête — colonnes RÉELLES du schema
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
        // ✅ vrai champ schema
        boostEndAt: users.boostEndAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(
        // Boost actif = boost_end_at > maintenant
        sql`CASE WHEN ${users.boostEndAt} IS NOT NULL AND ${users.boostEndAt} > NOW() THEN 1 ELSE 0 END DESC`,
        desc(users.lastSeen)
      )
      .limit(20);

    // 6. Likes reçus
    const myReceivedLikes = await db
      .select({
        fromUserId: likes.fromUserId,
        isSuperLike: likes.isSuperLike,
      })
      .from(likes)
      .where(
        and(eq(likes.toUserId, userId), eq(likes.isLike, true))
      );

    const finalProfiles = discoverProfiles.map((p) => {
      const receivedLike = myReceivedLikes.find((l) => l.fromUserId === p.id);
      const isBoosted =
        !!p.boostEndAt && new Date(p.boostEndAt).getTime() > Date.now();

      return {
        ...p,
        isBoosted,
        hasLikedMe: !!receivedLike,
        hasSuperLikedMe: receivedLike?.isSuperLike || false,
        // Photos galerie réservées Premium
        photo1Url: currentUser.isPremium ? p.photo1Url : null,
        photo2Url: currentUser.isPremium ? p.photo2Url : null,
        photo3Url: currentUser.isPremium ? p.photo3Url : null,
        photo4Url: currentUser.isPremium ? p.photo4Url : null,
      };
    });

    return NextResponse.json({
      profiles: finalProfiles,
      count: finalProfiles.length,
    });
  } catch (error) {
    console.error("Erreur API Discover:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
