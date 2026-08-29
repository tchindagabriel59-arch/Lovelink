import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      db: true,
      hasUrl: !!process.env.DATABASE_URL,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        db: false,
        hasUrl: !!process.env.DATABASE_URL,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
