import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __lovelinkPool?: Pool;
};

export const pool =
  globalForDb.__lovelinkPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    // ✅ OBLIGATOIRE pour Neon sur Vercel
    ssl: {
      rejectUnauthorized: false,
    },
  });

globalForDb.__lovelinkPool = pool;

export const db = drizzle(pool, { schema });
