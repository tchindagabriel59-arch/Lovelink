import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le user a bien reçu une notif "incomplete_profile" dans les 7 derniers jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const relance = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "incomplete_profile"),
          gte(notifications.createdAt, sevenDaysAgo)
        )
      )
      .limit(1);

    if (relance.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Pas de récompense éligible",
      });
    }

    // Vérifier que le profil est bien complet maintenant
    const [user] = await db
      .select({
        photoUrl: users.photoUrl,
        bio: users.bio,
        city: users.city,
        interests: users.interests,
        isPremium: users.isPremium,
        premiumExpiresAt: users.premiumExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User introuvable" }, { status: 404 });
    }

    const hasPhoto = user.photoUrl && user.photoUrl.trim() !== "";
    const hasBio = user.bio && user.bio.trim().length >= 10;
    const hasCity = user.city && user.city.trim() !== "";
    const hasInterests = user.interests && user.interests.trim() !== "";

    if (!hasPhoto || !hasBio || !hasCity || !hasInterests) {
      return NextResponse.json({
        success: false,
        message: "Profil pas encore complet",
        missing: {
          photo: !hasPhoto,
          bio: !hasBio,
          city: !hasCity,
          interests: !hasInterests,
        },
      });
    }

    // 🎁 Attribuer 7 jours Premium
    const now = new Date();
    let newExpiresAt: Date;

    // Si déjà Premium, ajouter 7 jours à la fin actuelle
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
      newExpiresAt = new Date(new Date(user.premiumExpiresAt).getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    await db
      .update(users)
      .set({
        isPremium: true,
        premiumExpiresAt: newExpiresAt,
        premiumPlan: "premium",
      })
      .where(eq(users.id, userId));

    // Marquer la relance comme "récompensée" pour éviter le double bonus
    await db
      .update(notifications)
      .set({ isRead: true, content: sql`${notifications.content} || ' [REWARDED]'` })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "incomplete_profile"),
          gte(notifications.createdAt, sevenDaysAgo)
        )
      );

    return NextResponse.json({
      success: true,
      message: "🎁 7 jours Premium débloqués !",
      premiumUntil: newExpiresAt,
    });
  } catch (error) {
    console.error("[Reward] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
