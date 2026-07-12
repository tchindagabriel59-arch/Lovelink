import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  // Générer une paire de clés VAPID
  const curve = crypto.createECDH("prime256v1");
  curve.generateKeys();

  const publicKey = curve.getPublicKey().toString("base64url");
  const privateKey = curve.getPrivateKey().toString("base64url");

  return NextResponse.json({
    success: true,
    message: "🔑 Voici tes clés VAPID ! COPIE-LES DANS VERCEL puis SUPPRIME ce fichier !",
    publicKey,
    privateKey,
    instructions: [
      "1. Copie NEXT_PUBLIC_VAPID_PUBLIC_KEY = " + publicKey,
      "2. Copie VAPID_PRIVATE_KEY = " + privateKey,
      "3. Ajoute VAPID_EMAIL = mailto:lovelink237@gmail.com",
      "4. SUPPRIME ce fichier après pour la sécurité !",
    ],
  });
}
