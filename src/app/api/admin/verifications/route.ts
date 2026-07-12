import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, PushTemplates } from "@/lib/push";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!adminUser[0]?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer le filtre depuis l'URL
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "pending";

    // Construire la requête selon le filtre
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

    // Compter les demandes en attente
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
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
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

    // Récupérer l'utilisateur concerné
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
      // ✅ APPROUVER → Badge bleu activé
      await db
        .update(users)
        .set({
          isVerified: true,
          verificationStatus: "approved",
          verificationReviewedAt: new Date(),
          verificationRejectedReason: null,
        })
        .where(eq(users.id, userId));

      // Notification in-app
      await createNotification({
        userId,
        type: "match", // on réutilise le type "match" pour les notifs système
        fromUserId: authUser.id,
        content: `✅ Félicitations ! Votre badge de vérification a été approuvé. Le badge bleu apparaît maintenant sur votre profil !`,
      });

      // 🔔 Push notification BADGE APPROUVÉ
      await sendPushToUser(
        userId,
        PushTemplates.verified()
      );

      return NextResponse.json({
        success: true,
        message: `Badge bleu approuvé pour ${target.firstName}`,
      });

    } else {
      // ❌ REFUSER → Avec raison
      await db
        .update(users)
        .set({
          isVerified: false,
          verificationStatus: "rejected",
          verificationReviewedAt: new Date(),
          verificationRejectedReason: reason ?? "Non conforme",
        })
        .where(eq(users.id, userId));

      // Notification in-app
      await createNotification({
        userId,
        type: "match",
        fromUserId: authUser.id,
        content: `❌ Votre demande de vérification a été refusée. Raison : ${reason ?? "Non conforme"}. Vous pouvez soumettre une nouvelle demande.`,
      });

      // 🔔 Push notification BADGE REFUSÉ
      await sendPushToUser(
        userId,
        {
          title: "❌ Demande de vérification refusée",
          body: `Raison : ${reason ?? "Non conforme"}. Vous pouvez soumettre une nouvelle demande.`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          url: "/verification",
          tag: "verification-rejected",
        }
      );

      return NextResponse.json({
        success: true,
        message: `Demande refusée pour ${target.firstName}`,
      });
    }
  } catch (error) {
    console.error("Erreur POST verifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
