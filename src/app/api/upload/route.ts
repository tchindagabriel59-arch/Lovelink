import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { logApiCall } from '@/lib/api-logger';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const endpoint = "/api/upload";
  const method = "POST";
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  let userId: number | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    // Silencieux
  }

  try {
    // Vérifier config Cloudinary
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("[UPLOAD] Configuration Cloudinary manquante");

      logApiCall({
        endpoint,
        method,
        statusCode: 500,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: "Configuration Cloudinary manquante dans les env vars",
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

    // Vérification taille (10 MB = raisonnable pour photos)
    if (buffer.byteLength > 10 * 1024 * 1024) {
      logApiCall({
        endpoint,
        method,
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userId,
        errorMessage: `Fichier trop lourd : ${sizeInMB.toFixed(1)} MB (max 10 MB)`,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(
        {
          error: `Photo trop lourde (${sizeInMB.toFixed(1)} MB). Maximum : 10 MB`,
        },
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

      return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
    }

    // Convertir en base64 data URI
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = request.headers.get("content-type") || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64}`;

    // ✅ Upload vers Cloudinary avec optimisations
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataUri,
        {
          folder: "lovelink", // Organise dans un dossier
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // Max 1200x1200
            { quality: "auto:good" }, // Compression intelligente
            { fetch_format: "auto" }, // WebP auto si supporté
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    const duration = Date.now() - startTime;
    console.log(`[UPLOAD] ✅ Succès Cloudinary en ${duration}ms`);

    logApiCall({
      endpoint,
      method,
      statusCode: 200,
      durationMs: duration,
      userId,
      errorMessage: `✅ Upload Cloudinary : ${sizeInMB.toFixed(2)} MB → ${uploadResult.secure_url}`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      display_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[UPLOAD] ❌ Échec après ${duration}ms:`, error);

    const errorMessage = error?.message || String(error);

    logApiCall({
      endpoint,
      method,
      statusCode: 500,
      durationMs: duration,
      userId,
      errorMessage: `❌ Upload Cloudinary échoué : ${errorMessage}`,
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      {
        error: "Impossible d'envoyer la photo. Réessaie ou choisis une autre photo.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
