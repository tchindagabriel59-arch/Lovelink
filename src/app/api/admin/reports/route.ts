import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { isCurrentUserAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// GET : Récupérer tous les signalements
export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const reporter = alias(users, "reporter");
    const reported = alias(users, "reported");

    const allReports = await db
      .select({
        id: reports.id,
        reason: reports.reason,
        details: reports.details,
        status: reports.status,
        createdAt: reports.createdAt,
        reporter: {
          id: reporter.id,
          firstName: reporter.firstName,
          lastName: reporter.lastName,
          email: reporter.email,
          photoUrl: reporter.photoUrl,
        },
        reported: {
          id: reported.id,
          firstName: reported.firstName,
          lastName: reported.lastName,
          email: reported.email,
          photoUrl: reported.photoUrl,
          isBanned: reported.isBanned,
        },
      })
      .from(reports)
      .innerJoin(reporter, eq(reports.reporterUserId, reporter.id))
      .innerJoin(reported, eq(reports.reportedUserId, reported.id))
      .orderBy(desc(reports.createdAt));

    return NextResponse.json({ reports: allReports });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH : Traiter un signalement (changer son statut)
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { reportId, status } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, reportId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE : Supprimer un signalement
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await db.delete(reports).where(eq(reports.id, parseInt(reportId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
