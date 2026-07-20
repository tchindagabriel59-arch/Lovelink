import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!adminUser[0]?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "pending";

    // Sélectionner TOUS les champs nécessaires (avec les photos)
    const selectFields = {
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
    };

    let allRequests;

    if (filter === "all") {
      allRequests = await db
        .select(selectFields)
        .from(users)
        .where(isNotNull(users.verificationStatus));
    } else {
      allRequests = await db
        .select(selectFields)
        .from(users)
        .where(eq(users.verificationStatus, filter as "pending" | "approved" | "rejected"));
    }

    const pendingRequests = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.verificationStatus, "pending"));

    // 🎯 CORRECTION : renvoyer "verifications" au lieu de "requests"
    return NextResponse.json({
      verifications: allRequests,
      pendingCount: pendingRequests.length,
    });
  } catch (error) {
    console.error("Erreur GET verifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();

    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!adminUser[0]?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 🎯 CORRECTION : accepter targetUserId (envoyé par le frontend) OU userId
    const body = await req.json();
    const targetUserId = body.targetUserId || body.userId;
    const action = body.action;
    const reason = body.reason;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide" },
        { status: 400 }
      );
    }

    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const target = targetUser[0];

    if (action === "approve") {
      await db
        .update(users)
        .set({
          isVerified: true,
          verificationStatus: "approved",
          verificationReviewedAt: new Date(),
          verificationRejectedReason: null,
        })
        .where(eq(users.id, targetUserId));

      await createNotification({
        userId: targetUserId,
        type: "match",
        fromUserId: adminId,
        content:
          "✅ Félicitations ! Votre badge de vérification a été approuvé. Le badge bleu apparaît maintenant sur votre profil !",
      });

      try {
        await sendPushToUser(targetUserId, PushTemplates.verified());
      } catch (err) {
        console.error("Erreur push notification:", err);
      }

      return NextResponse.json({
        success: true,
        message: `✅ Badge bleu approuvé pour ${target.firstName}`,
      });
    }

    // Rejet
    await db
      .update(users)
      .set({
        isVerified: false,
        verificationStatus: "rejected",
        verificationReviewedAt: new Date(),
        verificationRejectedReason: reason ?? "Non conforme",
      })
      .where(eq(users.id, targetUserId));

    await createNotification({
      userId: targetUserId,
      type: "match",
      fromUserId: adminId,
      content: `❌ Votre demande de vérification a été refusée. Raison : ${
        reason ?? "Non conforme"
      }. Vous pouvez soumettre une nouvelle demande.`,
    });

    try {
      await sendPushToUser(targetUserId, {
        title: "❌ Demande de vérification refusée",
        body: `Raison : ${
          reason ?? "Non conforme"
        }. Vous pouvez soumettre une nouvelle demande.`,
        icon: "/icon",
        badge: "/icon",
        url: "/verification",
        tag: "verification-rejected",
      });
    } catch (err) {
      console.error("Erreur push notification:", err);
    }

    return NextResponse.json({
      success: true,
      message: `❌ Demande refusée pour ${target.firstName}`,
    });
  } catch (error) {
    console.error("Erreur POST verifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
