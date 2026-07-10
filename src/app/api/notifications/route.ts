import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// GET : Récupérer les notifications
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userNotifs = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          photoUrl: users.photoUrl,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = userNotifs.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: userNotifs,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH : Marquer toutes comme lues
export async function PATCH() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE : Supprimer une notification
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get("id");

    if (!notifId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, parseInt(notifId)),
          eq(notifications.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notif error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
