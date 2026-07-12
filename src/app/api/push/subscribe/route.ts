import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// POST : S'abonner aux notifications push
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, userAgent } = body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Abonnement invalide" },
        { status: 400 }
      );
    }

    // Vérifier si cet endpoint existe déjà
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing) {
      // Si c'est le même user, on met à jour
      if (existing.userId === userId) {
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent: userAgent || existing.userAgent,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing.id));

        return NextResponse.json({
          success: true,
          message: "Abonnement mis à jour",
          updated: true,
        });
      }

      // Sinon, endpoint utilisé par un autre user (rare)
      return NextResponse.json(
        { error: "Endpoint déjà utilisé" },
        { status: 409 }
      );
    }

    // Créer un nouvel abonnement
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
    });

    return NextResponse.json({
      success: true,
      message: "🔔 Notifications activées !",
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE : Se désabonner
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      // Si pas d'endpoint fourni, supprimer TOUS les abonnements du user
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      return NextResponse.json({
        success: true,
        message: "Tous les abonnements supprimés",
      });
    }

    // Supprimer un abonnement spécifique
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return NextResponse.json({
      success: true,
      message: "🔕 Notifications désactivées",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET : Vérifier si l'utilisateur est abonné (au moins un appareil)
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const subs = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return NextResponse.json({
      subscribed: subs.length > 0,
      devices: subs.length,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
