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

    let allRequests;

    if (filter === "all") {
      allRequests = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          photoUrl: users.photoUrl,
          verificationStatus: users.verificationStatus,
          verificationPhotoUrl: users.verificationPhotoUrl,
          verificationSubmittedAt: users.verificationSubmittedAt,
          verificationReviewedAt: users.verificationReviewedAt,
          verificationRejectedReason: users.verificationRejectedReason,
          isVerified: users.isVerified,
        })
        .from(users)
        .where(isNotNull(users.verificationStatus));
    } else {
      allRequests = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          photoUrl: users.photoUrl,
          verificationStatus: users.verificationStatus,
          verificationPhotoUrl: users.verificationPhotoUrl,
          verificationSubmittedAt: users.verificationSubmittedAt,
          verificationReviewedAt: users.verificationReviewedAt,
          verificationRejectedReason: users.verificationRejectedReason,
          isVerified: users.isVerified,
        })
        .from(users)
        .where(eq(users.verificationStatus, filter));
    }

    const pendingRequests = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.verificationStatus, "pending"));

    return NextResponse.json({
      requests: allRequests,
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

    const { userId, action, reason } = await req.json();

    if (!userId || !action) {
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
      .where(eq(users.id, userId))
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
        .where(eq(users.id, userId));

      await createNotification({
        userId,
        type: "match",
        fromUserId: adminId,
        content:
          "✅ Félicitations ! Votre badge de vérification a été approuvé. Le badge bleu apparaît maintenant sur votre profil !",
      });

      await sendPushToUser(userId, PushTemplates.verified());

      return NextResponse.json({
        success: true,
        message: `Badge bleu approuvé pour ${target.firstName}`,
      });
    }

    await db
      .update(users)
      .set({
        isVerified: false,
        verificationStatus: "rejected",
        verificationReviewedAt: new Date(),
        verificationRejectedReason: reason ?? "Non conforme",
      })
      .where(eq(users.id, userId));

    await createNotification({
      userId,
      type: "match",
      fromUserId: adminId,
      content: `❌ Votre demande de vérification a été refusée. Raison : ${
        reason ?? "Non conforme"
      }. Vous pouvez soumettre une nouvelle demande.`,
    });

    await sendPushToUser(userId, {
      title: "❌ Demande de vérification refusée",
      body: `Raison : ${
        reason ?? "Non conforme"
      }. Vous pouvez soumettre une nouvelle demande.`,
      icon: "/icon",
      badge: "/icon",
      url: "/verification",
      tag: "verification-rejected",
    });

    return NextResponse.json({
      success: true,
      message: `Demande refusée pour ${target.firstName}`,
    });
  } catch (error) {
    console.error("Erreur POST verifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
