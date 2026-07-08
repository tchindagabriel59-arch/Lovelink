import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { reportedUserId, reason, details } = body;

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: "Utilisateur et motif requis" },
        { status: 400 }
      );
    }

    if (reportedUserId === userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous signaler vous-même" },
        { status: 400 }
      );
    }

    const [newReport] = await db
      .insert(reports)
      .values({
        reporterUserId: userId,
        reportedUserId: reportedUserId,
        reason: reason,
        details: details || "",
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      report: newReport,
      message: "Signalement envoyé. Notre équipe va examiner ce profil.",
    });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Erreur lors du signalement" },
      { status: 500 }
    );
  }
}
