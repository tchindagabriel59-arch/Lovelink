import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";

// 🔧 API TEMPORAIRE : Corrige les préférences des utilisateurs existants
// Utilisation : Visiter https://lovelink237.com/api/fix-preferences
// À SUPPRIMER après utilisation !

export async function GET() {
  try {
    // Récupérer tous les utilisateurs qui n'ont PAS de préférence de genre
    const usersToFix = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        gender: users.gender,
        prefGender: users.prefGender,
      })
      .from(users)
      .where(isNull(users.prefGender));

    const results = [];

    for (const user of usersToFix) {
      let newPrefGender: "male" | "female" | "non_binary" | "other" | null = null;

      switch (user.gender) {
        case "male":
          newPrefGender = "female";
          break;
        case "female":
          newPrefGender = "male";
          break;
        case "non_binary":
        case "other":
          newPrefGender = null; // Voit tout le monde
          break;
      }

      if (newPrefGender !== null || user.gender === "non_binary" || user.gender === "other") {
        await db
          .update(users)
          .set({
            prefGender: newPrefGender,
            prefAgeMin: 18,
            prefAgeMax: 99,
          })
          .where(eq(users.id, user.id));

        results.push({
          id: user.id,
          firstName: user.firstName,
          gender: user.gender,
          newPrefGender: newPrefGender ?? "all",
          status: "✅ Corrigé",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${results.length} utilisateur(s) corrigé(s) sur ${usersToFix.length} sans préférence`,
      instructions: "⚠️ SUPPRIME MAINTENANT ce fichier /api/fix-preferences pour la sécurité !",
      totalUsersWithoutPref: usersToFix.length,
      corrected: results,
    });
  } catch (error) {
    console.error("Fix preferences error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}
