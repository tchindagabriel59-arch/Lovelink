import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, likes, matches, messages, reports } from "@/db/schema";
import { isCurrentUserAdmin, getCurrentUserId } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const userIdInt = parseInt(userId);
    const currentAdminId = await getCurrentUserId();

    // Sécurité : Empêcher de se supprimer soi-même
    if (userIdInt === currentAdminId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous supprimer vous-même" },
        { status: 400 }
      );
    }

    // Supprimer toutes les données liées (dans l'ordre pour éviter les erreurs de clés étrangères)
    await db.delete(reports).where(
      or(eq(reports.reporterUserId, userIdInt), eq(reports.reportedUserId, userIdInt))
    );
    await db.delete(messages).where(eq(messages.senderId, userIdInt));
    await db.delete(matches).where(
      or(eq(matches.user1Id, userIdInt), eq(matches.user2Id, userIdInt))
    );
    await db.delete(likes).where(
      or(eq(likes.fromUserId, userIdInt), eq(likes.toUserId, userIdInt))
    );
    await db.delete(users).where(eq(users.id, userIdInt));

    return NextResponse.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
