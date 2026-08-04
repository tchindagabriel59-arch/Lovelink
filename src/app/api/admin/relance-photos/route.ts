import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql, isNull, or, eq } from "drizzle-orm";
import { sendPhotoReminderEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    // 🔍 Récupérer tous les utilisateurs sans photo
    // On cherche où photos est null, vide [] ou string vide
    const usersWithoutPhotos = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          isNull(users.photos),
          sql`json_array_length(COALESCE(${users.photos}, '[]'::json)) = 0`,
          sql`${users.photos}::text = '[]'`,
          sql`${users.photos}::text = '""'`
        )
      );

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of usersWithoutPhotos) {
      if (!user.email) continue;

      // Calculer le nombre de jours depuis l'inscription
      const createdDate = new Date(user.createdAt || Date.now());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const daysWithoutPhoto = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      // Envoi de l'email
      const result = await sendPhotoReminderEmail(
        user.email,
        user.firstName || "Cher membre",
        daysWithoutPhoto
      );

      if (result.success) {
        sentCount++;
      } else {
        errors.push(`Erreur pour ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${sentCount} emails de relance envoyés sur ${usersWithoutPhotos.length} utilisateurs sans photo`,
      totalWithoutPhotos: usersWithoutPhotos.length,
      sentCount,
      errors,
    });
  } catch (error: any) {
    console.error("Erreur relance photos:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des relances", details: error.message },
      { status: 500 }
    );
  }
}
