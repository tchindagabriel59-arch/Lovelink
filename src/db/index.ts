import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const connectionString = databaseUrl.includes("sslmode=")
  ? databaseUrl
  : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=require`;

const globalForDb = globalThis as typeof globalThis & {
  __lovelinkPool?: Pool;
};

function createPool() {
  return new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 20000,
    ssl: { rejectUnauthorized: false },
  });
}

export const pool = globalForDb.__lovelinkPool ?? createPool();
globalForDb.__lovelinkPool = pool;

export const db = drizzle(pool, { schema });
