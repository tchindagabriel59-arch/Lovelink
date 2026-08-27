import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { Resend } from "resend";
import { sendPushToUser, PushTemplates } from "@/lib/push";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!(admin as any)?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { paymentId } = await req.json();
    if (!paymentId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const name = user.firstName || "Cher membre";
    const email = user.email;
    const planName = (payment.plan || "Boost").toUpperCase();

    // 1. Envoi de la notification Push sur son téléphone (s'il a accepté)
    sendPushToUser(user.id, {
      title: `🚀 Ton ${planName} LoveLink t'attend !`,
      body: `Finalise ton paiement pour passer en priorité dans ta ville.`,
      url: "/premium",
    }).catch(() => {});

    // 2. Envoi de l'e-mail de relance si c'est un e-mail réel (pas un e-mail synthétique phone_...)
    if (email && !email.includes("@phone.lovelink237.com")) {
      await resend.emails.send({
        from: "LoveLink Support <support@lovelink237.com>",
        to: [email],
        subject: `💕 ${name}, ton ${planName} LoveLink t'attend !`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e11d48; margin: 0;">💕 LoveLink</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0;">Bonjour ${name} ! 👋</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Nous avons remarqué que tu as tenté d'activer ton option <strong>${planName} (${payment.billingPeriod})</strong> sur LoveLink.
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Si tu as rencontré une difficulté lors du paiement par Mobile Money (MTN / Orange) ou si tu as besoin d'aide pour finaliser, notre équipe est là pour t'accompagner !
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/237651387914?text=Bonjour%20Support%20LoveLink,%20j'ai%20besoin%20d'aide%20pour%20mon%20paiement" 
                   style="background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
                  💬 Contacter le Support WhatsApp
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-0;">
                À très vite sur LoveLink ! ✨
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Relance Email Error:", error);
    return NextResponse.json({ error: error?.message || "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}
