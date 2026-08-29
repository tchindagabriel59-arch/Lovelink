import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasUrl = !!process.env.DATABASE_URL;
  const host = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:[^:@/]+@/, ":****@").slice(0, 80)
    : null;

  try {
    const result = await db.execute(sql`select 1 as ok`);
    return NextResponse.json({ ok: true, db: true, hasUrl, host, result });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        db: false,
        hasUrl,
        host,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
