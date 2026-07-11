import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// GET : Récupérer le statut de vérification
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        isVerified: users.isVerified,
        verificationStatus: users.verificationStatus,
        verificationPhotoUrl: users.verificationPhotoUrl,
        verificationSubmittedAt: users.verificationSubmittedAt,
        verificationReviewedAt: users.verificationReviewedAt,
        verificationRejectedReason: users.verificationRejectedReason,
        photoUrl: users.photoUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      isVerified: user.isVerified,
      status: user.verificationStatus, // null / pending / approved / rejected
      submittedAt: user.verificationSubmittedAt,
      reviewedAt: user.verificationReviewedAt,
      rejectedReason: user.verificationRejectedReason,
      hasProfilePhoto: !!user.photoUrl,
    });
  } catch (error) {
    console.error("Get verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Soumettre une demande de vérification
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { photoUrl } = body;

    if (!photoUrl || typeof photoUrl !== "string" || !photoUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "URL de la photo requise" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà une demande en cours
    const [user] = await db
      .select({
        isVerified: users.isVerified,
        verificationStatus: users.verificationStatus,
        photoUrl: users.photoUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "Ton profil est déjà vérifié ✅" },
        { status: 400 }
      );
    }

    if (user.verificationStatus === "pending") {
      return NextResponse.json(
        { error: "Ta demande est déjà en cours d'examen" },
        { status: 400 }
      );
    }

    if (!user.photoUrl) {
      return NextResponse.json(
        { error: "Tu dois d'abord ajouter une photo de profil" },
        { status: 400 }
      );
    }

    // Soumettre la demande
    await db
      .update(users)
      .set({
        verificationStatus: "pending",
        verificationPhotoUrl: photoUrl,
        verificationSubmittedAt: new Date(),
        verificationRejectedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "🎉 Ta demande a été envoyée ! Nous l'examinerons sous 24-48h.",
    });
  } catch (error) {
    console.error("Post verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE : Annuler une demande en attente
export async function DELETE() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [user] = await db
      .select({
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: "Aucune demande en cours" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        verificationStatus: null,
        verificationPhotoUrl: null,
        verificationSubmittedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Demande annulée",
    });
  } catch (error) {
    console.error("Delete verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
