import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { logApiCall } from '@/lib/api-logger';

// 🆕 Nouvelle façon Next.js App Router
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ✅ MONITORING
  const startTime = Date.now();
  const endpoint = "/api/upload";
  const method = "POST";
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  // Récupérer userId (optionnel car upload peut fonctionner sans auth stricte)
  let userId: number | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    // Silencieux
  }

  try {
    const apiKey = process.env.IMGBB_API_KEY;
    
    if (!apiKey) {
      console.error("[UPLOAD] IMGBB_API_KEY manquante");
      
      // ✅ LOG : Config manquante
      logApiCall({
        endpoint,
        method,
        statusCode: 500,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "IMGBB_API_KEY manquante dans les env vars",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Configuration serveur manquante. Contacte le support." },
        { status: 500 }
      );
    }

    if (!request.body) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Aucun fichier fourni (body vide)",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Récupérer le fichier
    const buffer = await request.arrayBuffer();
    const sizeInMB = buffer.byteLength / (1024 * 1024);
    
    console.log(`[UPLOAD] Fichier reçu : ${sizeInMB.toFixed(2)} MB`);

    // 🛡️ Vérification taille (32 MB = limite ImgBB)
    if (buffer.byteLength > 32 * 1024 * 1024) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Fichier trop lourd : ${sizeInMB.toFixed(1)} MB (max 32 MB)`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: `Photo trop lourde (${sizeInMB.toFixed(1)} MB). Maximum : 32 MB` },
        { status: 400 }
      );
    }

    if (buffer.byteLength === 0) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Fichier vide (0 bytes)",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Fichier vide" },
        { status: 400 }
      );
    }

    const base64 = Buffer.from(buffer).toString('base64');

    // 🔄 Fonction de retry pour ImgBB
    async function uploadWithRetry(attempt: number = 1): Promise<any> {
      const MAX_ATTEMPTS = 3;
      
      try {
        const formData = new FormData();
        formData.append('image', base64);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${apiKey}`,
          {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000), // 30s timeout
          }
        );

        const data = await response.json();

        if (data.success) {
          return { data, attempts: attempt };
        }

        // Détecter les erreurs de quota ImgBB
        if (data.error?.message?.includes("quota") || data.status_code === 429) {
          throw new Error("QUOTA_EXCEEDED");
        }

        // Si erreur ImgBB générique, retry
        if (attempt < MAX_ATTEMPTS) {
          console.warn(`[UPLOAD] Tentative ${attempt} échouée, retry...`, data);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          return uploadWithRetry(attempt + 1);
        }

        throw new Error(data.error?.message || "Erreur ImgBB inconnue");
      } catch (error: any) {
        if (error.name === 'TimeoutError' && attempt < MAX_ATTEMPTS) {
          console.warn(`[UPLOAD] Timeout tentative ${attempt}, retry...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          return uploadWithRetry(attempt + 1);
        }
        throw error;
      }
    }

    // Upload avec retry
    const { data, attempts } = await uploadWithRetry();

    const duration = Date.now() - startTime;
    console.log(`[UPLOAD] ✅ Succès en ${duration}ms`);

    // ✅ LOG : Succès 200 - upload réussi
    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: duration,
      userId,
      errorMessage: `✅ Upload réussi : ${sizeInMB.toFixed(2)} MB${attempts > 1 ? ` (${attempts} tentatives)` : ""}`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      url: data.data.url,
      display_url: data.data.display_url,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[UPLOAD] ❌ Échec après ${duration}ms:`, error);

    const errorMessage = error?.message || String(error);

    // Messages d'erreur clairs pour l'utilisateur
    if (errorMessage === "QUOTA_EXCEEDED") {
      // ✅ LOG : Quota ImgBB dépassé (CRITIQUE !)
      logApiCall({
        endpoint,
        method,
        statusCode: 503,
        durationMs: duration,
        userId,
        errorMessage: "🚨 QUOTA IMGBB DÉPASSÉ - Photo non uploadée",
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { 
          error: "Le service de photos est temporairement saturé. Réessaie dans quelques minutes.",
          code: "QUOTA_EXCEEDED"
        },
        { status: 503 }
      );
    }

    if (error.name === 'TimeoutError') {
      // ✅ LOG : Timeout
      logApiCall({
        endpoint,
        method,
        statusCode: 408,
        durationMs: duration,
        userId,
        errorMessage: `⏱️ Timeout upload (30s dépassées)`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        { error: "La photo prend trop de temps à s'envoyer. Vérifie ta connexion internet." },
        { status: 408 }
      );
    }

    // ✅ LOG : Erreur 500 générale
    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: duration,
      userId,
      errorMessage: `❌ Upload échoué : ${errorMessage}`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      { 
        error: "Impossible d'envoyer la photo. Réessaie ou choisis une autre photo.",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
