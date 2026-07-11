import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// GET : Récupérer toutes les demandes de vérification
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const [me] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!me?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Filtre par statut (pending par défaut)
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "pending";

    let conditions;
    if (filter === "all") {
      conditions = isNotNull(users.verificationStatus);
    } else {
      conditions = eq(users.verificationStatus, filter);
    }

    const verifications = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        photoUrl: users.photoUrl,
        photo1Url: users.photo1Url,
        photo2Url: users.photo2Url,
        photo3Url: users.photo3Url,
        photo4Url: users.photo4Url,
        verificationStatus: users.verificationStatus,
        verificationPhotoUrl: users.verificationPhotoUrl,
        verificationSubmittedAt: users.verificationSubmittedAt,
        verificationReviewedAt: users.verificationReviewedAt,
        verificationRejectedReason: users.verificationRejectedReason,
        isVerified: users.isVerified,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(conditions)
      .orderBy(desc(users.verificationSubmittedAt));

    // Compter les demandes en attente
    const pending = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.verificationStatus, "pending"));

    return NextResponse.json({
      verifications,
      pendingCount: pending.length,
    });
  } catch (error) {
    console.error("Get admin verifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Valider ou refuser une demande
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [me] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!me?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible a une demande en attente
    const [target] = await db
      .select({
        firstName: users.firstName,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (target.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: "Aucune demande en attente pour cet utilisateur" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "approve") {
      await db
        .update(users)
        .set({
          isVerified: true,
          verificationStatus: "approved",
          verificationReviewedAt: now,
          verificationRejectedReason: null,
          updatedAt: now,
        })
        .where(eq(users.id, targetUserId));

      // Notification à l'utilisateur
      await createNotification({
        userId: targetUserId,
        type: "match", // On réutilise le type match pour l'apparence
        fromUserId: userId,
        content: "🎉 Ton profil a été vérifié ! Tu as maintenant le badge bleu 💙",
      });

      return NextResponse.json({
        success: true,
        message: `✅ ${target.firstName} a été vérifié(e) !`,
      });
    } else {
      // Refuser
      await db
        .update(users)
        .set({
          isVerified: false,
          verificationStatus: "rejected",
          verificationReviewedAt: now,
          verificationRejectedReason: reason || "Photo non conforme aux critères de vérification",
          updatedAt: now,
        })
        .where(eq(users.id, targetUserId));

      // Notification à l'utilisateur
      await createNotification({
        userId: targetUserId,
        type: "message",
        fromUserId: userId,
        content: "Ta demande de vérification a été refusée. Consulte la page vérification pour plus d'infos.",
      });

      return NextResponse.json({
        success: true,
        message: `❌ Demande de ${target.firstName} refusée`,
      });
    }
  } catch (error) {
    console.error("Post admin verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
