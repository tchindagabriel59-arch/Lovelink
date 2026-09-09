import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { Resend } from "resend";
import { sendPushToUser } from "@/lib/push";

const resend = new Resend(process.env.RESEND_API_KEY || "");

// Doit être le même domaine vérifié que dans src/lib/emails.ts
const FROM_EMAIL = "Gabriel de LoveLink <support@lovelink237.com>";
const REPLY_TO = "lovelink237@gmail.com";
const SUPPORT_WHATSAPP = "221787533626";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lovelink237.com";

export async function POST(req: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!(admin as any)?.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[Relance] RESEND_API_KEY manquante");
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY manquante sur le serveur. Ajoute-la dans Vercel → Environment Variables.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = Number(body.paymentId);

    if (!paymentId || Number.isNaN(paymentId)) {
      return NextResponse.json({ error: "ID paiement manquant" }, { status: 400 });
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payment.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const name = user.firstName || "Cher membre";
    const email = (user.email || "").trim();
    const planName = String(payment.plan || "offre").toUpperCase();
    const period = String(payment.billingPeriod || "");
    const amount = payment.amount || 0;
    const currency = payment.currency || "XOF";

    const isSyntheticPhoneEmail =
      !email || email.includes("@phone.lovelink237.com");

    // 1) Push (best effort)
    let pushSent = false;
    try {
      await sendPushToUser(user.id, {
        title: `🚀 Ton ${planName} LoveLink t'attend !`,
        body: `Finalise ton paiement (${amount} ${currency}) pour activer ton offre.`,
        url: planName.includes("BOOST") ? "/boost" : "/premium",
      });
      pushSent = true;
    } catch (e) {
      console.error("[Relance] Push error:", e);
    }

    // 2) Email uniquement si vraie adresse
    if (isSyntheticPhoneEmail) {
      return NextResponse.json({
        success: true,
        emailSent: false,
        pushSent,
        message:
          "Pas d'e-mail réel (compte téléphone). Utilise WhatsApp pour relancer.",
      });
    }

    const paymentUrl = planName.includes("BOOST")
      ? `${SITE_URL}/boost`
      : `${SITE_URL}/premium`;

    const waHelp = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
      `Bonjour Support LoveLink, j'ai besoin d'aide pour mon paiement ${planName} (${amount} ${currency}).`
    )}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: REPLY_TO,
      subject: `💕 ${name}, ton ${planName} LoveLink t'attend !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #e11d48; margin: 0;">💕 LoveLink</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; margin-top: 0;">Bonjour ${name} ! 👋</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Nous avons remarqué que tu as initié l'activation de
              <strong>${planName}${period ? ` (${period})` : ""}</strong>
              pour <strong>${amount} ${currency}</strong> sur LoveLink.
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Si tu as eu un souci avec Mobile Money (MTN / Orange / Wave) ou si tu as besoin d'aide pour finaliser, on est là.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${paymentUrl}"
                 style="background: linear-gradient(135deg,#f43f5e,#a855f7); color:#fff; padding:14px 28px; text-decoration:none; border-radius:30px; font-weight:bold; font-size:14px; display:inline-block; margin-bottom:12px;">
                💳 Reprendre mon paiement
              </a>
              <br/>
              <a href="${waHelp}"
                 style="background-color:#22c55e; color:#fff; padding:14px 28px; text-decoration:none; border-radius:30px; font-weight:bold; font-size:14px; display:inline-block;">
                💬 Contacter le Support WhatsApp
              </a>
            </div>
            <p style="color:#94a3b8; font-size:12px; text-align:center; margin:0;">
              À très vite sur LoveLink ! ✨
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Relance] Resend error:", error);
      return NextResponse.json(
        {
          error:
            typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : "Resend a refusé l'envoi de l'e-mail",
          details: error,
          pushSent,
        },
        { status: 502 }
      );
    }

    console.log("[Relance] Email OK:", { to: email, id: data?.id });

    return NextResponse.json({
      success: true,
      emailSent: true,
      pushSent,
      resendId: data?.id || null,
      to: email,
    });
  } catch (error: any) {
    console.error("Relance Email Error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
