import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const isBanned = action === "ban";

    await db
      .update(users)
      .set({ isBanned })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: isBanned ? "Utilisateur banni" : "Utilisateur débanni",
    });
  } catch (error) {
    console.error("Ban error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
