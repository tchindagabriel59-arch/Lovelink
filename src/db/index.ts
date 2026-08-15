import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// ⚡ Configuration WebSocket pour Neon serverless
neonConfig.webSocketConstructor = ws;

// ⚡ CACHE GLOBAL : Réutiliser la même connexion partout
// Fonctionne AUSSI en production (contrairement à l'ancien code)
const globalForDb = globalThis as typeof globalThis & {
  __lovelinkPool?: Pool;
};

export const pool =
  globalForDb.__lovelinkPool ??
  new Pool({
    connectionString: databaseUrl,
    // ⚡ Optimisations critiques pour Neon
    max: 10,                    // Max 10 connexions simultanées
    idleTimeoutMillis: 30000,   // Ferme les connexions inactives après 30s
    connectionTimeoutMillis: 10000, // Timeout connexion à 10s
  });

// ✅ Cache GLOBAL même en production (crucial pour Vercel serverless)
globalForDb.__lovelinkPool = pool;

export const db = drizzle(pool);
