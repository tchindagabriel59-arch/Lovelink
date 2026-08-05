import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, referrals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { getReferralStats, findUserByReferralCode, applyReferralReward } from "@/lib/referral";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les stats du user connecté
    const stats = await getReferralStats(userId);

    if (!stats) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      referralCode: stats.referralCode,
      referralCount: stats.referralCount,
      premiumDaysEarned: stats.premiumDaysEarned,
      premiumExpiresAt: stats.premiumExpiresAt,
      filleuls: stats.filleuls,
    });
  } catch (error: any) {
    console.error("Erreur GET referral:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Action : valider un code de parrainage si pas encore fait
    if (action === "check_referral") {
      // Cette logique est déjà gérée lors de l'inscription,
      // mais on peut retourner le statut actuel
      const stats = await getReferralStats(userId);
      return NextResponse.json({
        success: true,
        referredByExists: stats?.filleuls ? false : true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "API de parrainage active",
    });
  } catch (error: any) {
    console.error("Erreur POST referral:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
