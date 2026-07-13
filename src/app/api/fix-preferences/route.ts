import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// 🎯 API temporaire pour corriger les préférences des utilisateurs existants
// Sécurisée : seul l'admin peut lancer cette opération
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est l'admin
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Réservé aux admins" },
        { status: 403 }
      );
    }

    // Récupérer tous les utilisateurs qui n'ont PAS encore de préférence de genre
    const usersWithoutPref = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        gender: users.gender,
        prefGender: users.prefGender,
      })
      .from(users)
      .where(isNull(users.prefGender));

    const updates: {
      id: number;
      firstName: string;
      gender: string;
      newPrefGender: string;
    }[] = [];

    for (const user of usersWithoutPref) {
      let newPrefGender: "male" | "female" | null = null;

      if (user.gender === "male") {
        newPrefGender = "female"; // Homme → voit des femmes
      } else if (user.gender === "female") {
        newPrefGender = "male"; // Femme → voit des hommes
      }

      if (newPrefGender) {
        await db
          .update(users)
          .set({
            prefGender: newPrefGender,
            prefAgeMin: 18,
            prefAgeMax: 99,
          })
          .where(eq(users.id, user.id));

        updates.push({
          id: user.id,
          firstName: user.firstName,
          gender: user.gender,
          newPrefGender,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updates.length} utilisateurs mis à jour !`,
      total: usersWithoutPref.length,
      updated: updates,
      note: "⚠️ SUPPRIME ce fichier après utilisation pour la sécurité !",
    });
  } catch (error) {
    console.error("Fix preferences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
