import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// ⚡ CACHE GLOBAL : Réutiliser la même connexion partout
// FONCTIONNE EN PRODUCTION (contrairement à l'ancien code)
const globalForDb = globalThis as typeof globalThis & {
  __lovelinkPool?: Pool;
};

export const pool =
  globalForDb.__lovelinkPool ??
  new Pool({
    connectionString: databaseUrl,
    // ⚡ Optimisations critiques pour Neon
    max: 10,                          // Max 10 connexions simultanées
    idleTimeoutMillis: 30000,         // Ferme connexions inactives après 30s
    connectionTimeoutMillis: 10000,   // Timeout connexion à 10s
    // ⚡ Keep-alive TCP pour éviter les déconnexions
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

// ✅ IMPORTANT : Cache GLOBAL même en production
// C'est LA correction majeure qui va TOUT changer
globalForDb.__lovelinkPool = pool;

export const db = drizzle(pool);
