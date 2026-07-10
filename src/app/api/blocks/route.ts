import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blocks, users, matches, messages } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";

// GET : Récupérer la liste des utilisateurs bloqués
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const blockedList = await db
      .select({
        blockId: blocks.id,
        createdAt: blocks.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          photoUrl: users.photoUrl,
          city: users.city,
        },
      })
      .from(blocks)
      .innerJoin(users, eq(blocks.blockedUserId, users.id))
      .where(eq(blocks.blockerUserId, userId));

    return NextResponse.json({ blocked: blockedList });
  } catch (error) {
    console.error("Get blocks error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Bloquer un utilisateur
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { blockedUserId } = await req.json();

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    if (blockedUserId === userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bloquer vous-même" },
        { status: 400 }
      );
    }

    // Vérifier si déjà bloqué
    const [existing] = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.blockerUserId, userId),
          eq(blocks.blockedUserId, blockedUserId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Utilisateur déjà bloqué" },
        { status: 400 }
      );
    }

    // Créer le blocage
    await db.insert(blocks).values({
      blockerUserId: userId,
      blockedUserId: blockedUserId,
    });

    // Supprimer les matchs entre les 2 utilisateurs
    const user1 = Math.min(userId, blockedUserId);
    const user2 = Math.max(userId, blockedUserId);

    const [matchToDelete] = await db
      .select()
      .from(matches)
      .where(and(eq(matches.user1Id, user1), eq(matches.user2Id, user2)))
      .limit(1);

    if (matchToDelete) {
      // Supprimer les messages de ce match
      await db.delete(messages).where(eq(messages.matchId, matchToDelete.id));
      // Supprimer le match
      await db.delete(matches).where(eq(matches.id, matchToDelete.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Block error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE : Débloquer un utilisateur
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get("userId");

    if (!blockedUserId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await db
      .delete(blocks)
      .where(
        and(
          eq(blocks.blockerUserId, userId),
          eq(blocks.blockedUserId, parseInt(blockedUserId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
