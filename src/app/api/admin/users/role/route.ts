import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isCurrentUserAdmin, getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId, role, value } = await req.json();

    if (!userId || !role || value === undefined) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Sécurité : Empêcher de se retirer ses propres droits admin
    const currentAdminId = await getCurrentUserId();
    if (userId === currentAdminId && role === "isAdmin" && value === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer vos propres droits admin" },
        { status: 400 }
      );
    }

    const validRoles = ["isAdmin", "isPremium", "isBanned"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    const updateData: Record<string, boolean> = {};
    updateData[role] = value;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
