import { NextResponse } from "next/server";
import webpush from "web-push";

export async function GET() {
  const vapidKeys = webpush.generateVAPIDKeys();

  return NextResponse.json({
    message: "🔑 Nouvelles clés VAPID générées ! Copie-les dans Vercel puis SUPPRIME ce fichier.",
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
    email: "mailto:lovelink237@gmail.com",
    instructions: [
      "1. Va sur Vercel → Settings → Environment Variables",
      "2. Remplace NEXT_PUBLIC_VAPID_PUBLIC_KEY par la valeur 'publicKey' ci-dessus",
      "3. Remplace VAPID_PRIVATE_KEY par la valeur 'privateKey' ci-dessus",
      "4. Vérifie que VAPID_EMAIL = mailto:lovelink237@gmail.com",
      "5. Redéploie",
      "6. SUPPRIME ce fichier generate-vapid IMMÉDIATEMENT !",
    ],
  });
}
