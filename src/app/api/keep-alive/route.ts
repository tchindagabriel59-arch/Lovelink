import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

// ⚡ Endpoint appelé toutes les 5 min pour garder Neon "réveillé"
// Empêche le Cold Start du Free Tier Neon PostgreSQL
export async function GET() {
  try {
    // Requête ultra-simple juste pour toucher la BDD
    await db.select({ count: sql<number>`1` }).from(users).limit(1);
    
    return NextResponse.json(
      { 
        status: "alive", 
        timestamp: Date.now(),
        message: "LoveLink DB is awake 🌸"
      },
      {
        headers: {
          "Cache-Control": "no-store", // Toujours frais
        }
      }
    );
  } catch (error) {
    console.error("Keep-alive error:", error);
    return NextResponse.json(
      { status: "error" }, 
      { status: 500 }
    );
  }
}
