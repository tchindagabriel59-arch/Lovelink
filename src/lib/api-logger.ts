import { db } from "@/db";
import { apiLogs } from "@/db/schema";

interface LogParams {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  userId?: number | null;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log une requête API dans la BDD
 * Utilise `.catch()` pour ne JAMAIS bloquer la réponse en cas d'erreur
 */
export function logApiCall(params: LogParams) {
  // Async fire-and-forget (ne bloque pas la réponse)
  db.insert(apiLogs)
    .values({
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      userId: params.userId || null,
      errorMessage: params.errorMessage || null,
      userAgent: params.userAgent || null,
      ipAddress: params.ipAddress || null,
    })
    .catch((err) => {
      console.error("[API Logger] Erreur enregistrement:", err);
    });
}

/**
 * Helper pour wrapper une fonction API et logger automatiquement
 */
export async function withLogging<T>(
  request: Request,
  handler: () => Promise<T>,
  options?: {
    userId?: number | null;
    endpoint?: string;
  }
): Promise<T> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const endpoint = options?.endpoint || url.pathname;
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  try {
    const result = await handler();
    const duration = Date.now() - startTime;

    // Détecter le status code depuis le résultat (Response ou NextResponse)
    let statusCode = 200;
    if (result && typeof result === "object" && "status" in result) {
      statusCode = (result as any).status || 200;
    }

    logApiCall({
      endpoint,
      method,
      statusCode,
      durationMs: duration,
      userId: options?.userId,
      userAgent,
      ipAddress,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: duration,
      userId: options?.userId,
      errorMessage,
      userAgent,
      ipAddress,
    });

    throw error;
  }
}
