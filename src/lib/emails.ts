import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ MODE PRODUCTION : emails envoyés depuis ton domaine lovelink237.com
const FROM_EMAIL = "LoveLink <noreply@lovelink237.com>";
const REPLY_TO = "lovelink237@gmail.com";
const SITE_URL = "https://lovelink237.com";

// 📧 Email de bienvenue
export async function sendWelcomeEmail(
  userEmail: string,
  firstName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      replyTo: REPLY_TO,
      subject: `Bienvenue sur LoveLink, ${firstName} ! 💜`,
      html: welcomeEmailTemplate(firstName),
    });

    if (error) {
      console.error("Erreur envoi email bienvenue:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error };
  }
}

// 💕 Email de nouveau match
export async function sendMatchEmail(
  userEmail: string,
  userFirstName: string,
  matchFirstName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      replyTo: REPLY_TO,
      subject: `🎉 C'est un match avec ${matchFirstName} !`,
      html: matchEmailTemplate(userFirstName, matchFirstName),
    });

    if (error) {
      console.error("Erreur envoi email match:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// 💬 Email de nouveau message
export async function sendMessageEmail(
  userEmail: string,
  userFirstName: string,
  senderFirstName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      replyTo: REPLY_TO,
      subject: `💬 Nouveau message de ${senderFirstName}`,
      html: messageEmailTemplate(userFirstName, senderFirstName),
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// 📸 Email de rappel photo (NOUVEAU)
export async function sendPhotoReminderEmail(
  userEmail: string,
  firstName: string,
  daysWithoutPhoto: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      replyTo: REPLY_TO,
      subject: `📸 ${firstName}, ajoute ta photo pour trouver l'amour !`,
      html: photoReminderEmailTemplate(firstName, daysWithoutPhoto),
    });

    if (error) {
      console.error("Erreur envoi email photo reminder:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// ============ TEMPLATES HTML ============

const baseStyle = `
  <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
    <div style="background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: white; font-size: 32px; margin: 0; font-weight: 800;">
        💜 LoveLink
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
        Trouvez l'amour, l'amitié et de belles rencontres
      </p>
    </div>
`;

const baseFooter = `
    <div style="background-color: #1e293b; padding: 30px 20px; text-align: center; border-radius: 0 0 16px 16px;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px;">
        💜 Fait avec amour au Sénégal
      </p>
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} LoveLink - Marketing de Boutique Numérique<br>
        Dakar, Sénégal
      </p>
      <div style="margin-top: 20px;">
        <a href="${SITE_URL}/cgu" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">CGU</a>
        <a href="${SITE_URL}/confidentialite" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">Confidentialité</a>
        <a href="mailto:lovelink237@gmail.com" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">Contact</a>
      </div>
      <p style="color: #475569; font-size: 11px; margin: 20px 0 0;">
        Tu reçois cet email car tu es inscrit sur LoveLink.<br>
        Pour te désinscrire, connecte-toi à ton compte.
      </p>
    </div>
  </div>
`;

function welcomeEmailTemplate(firstName: string): string {
  return `
    ${baseStyle}
    <div style="background-color: white; padding: 40px 30px;">
      <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 16px;">
        Bienvenue ${firstName} ! 🎉
      </h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Nous sommes ravis de t'accueillir dans la communauté LoveLink ! Tu viens de rejoindre des milliers de célibataires qui cherchent l'amour, l'amitié ou de nouvelles connaissances.
      </p>

      <div style="background: linear-gradient(135deg, #fef3f2 0%, #f5f3ff 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">
          🚀 Pour bien commencer :
        </h3>
        <ul style="color: #475569; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li>📸 Ajoute de belles photos à ton profil</li>
          <li>✍️ Rédige une bio qui te ressemble</li>
          <li>🎯 Précise ce que tu recherches</li>
          <li>❤️ Découvre les profils qui te correspondent</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${SITE_URL}/profile" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Compléter mon profil →
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        💡 <strong>Astuce :</strong> Les profils avec au moins 3 photos et une bio complète reçoivent <strong>5x plus de matchs</strong> !
      </p>
    </div>
    ${baseFooter}
  `;
}

function matchEmailTemplate(userFirstName: string, matchFirstName: string): string {
  return `
    ${baseStyle}
    <div style="background-color: white; padding: 40px 30px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">💕</div>
      <h2 style="color: #1e293b; font-size: 28px; margin: 0 0 12px;">
        C'est un match !
      </h2>
      <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 24px;">
        ${userFirstName}, tu as un nouveau match avec <strong style="color: #f43f5e;">${matchFirstName}</strong> !
      </p>
      
      <div style="background: linear-gradient(135deg, #fef3f2 0%, #f5f3ff 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: #475569; font-size: 15px; margin: 0;">
          Vous vous êtes mutuellement likés ! N'attends pas trop pour envoyer un premier message et faire la différence 💌
        </p>
      </div>

      <div style="margin: 32px 0;">
        <a href="${SITE_URL}/messages" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Envoyer un message 💬
        </a>
      </div>
    </div>
    ${baseFooter}
  `;
}

function messageEmailTemplate(userFirstName: string, senderFirstName: string): string {
  return `
    ${baseStyle}
    <div style="background-color: white; padding: 40px 30px;">
      <div style="font-size: 48px; margin-bottom: 16px; text-align: center;">💬</div>
      <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 12px; text-align: center;">
        Nouveau message !
      </h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
        ${userFirstName}, tu as reçu un nouveau message de <strong style="color: #f43f5e;">${senderFirstName}</strong>
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${SITE_URL}/messages" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Lire le message →
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0;">
        Réponds rapidement pour maximiser tes chances ! ⚡
      </p>
    </div>
    ${baseFooter}
  `;
}

function photoReminderEmailTemplate(firstName: string, days: number): string {
  const urgencyMessage = days >= 3 
    ? "Ton profil est presque invisible sans photo ! 😢" 
    : "Tu passes à côté de beaucoup de rencontres ! 💔";

  return `
    ${baseStyle}
    <div style="background-color: white; padding: 40px 30px;">
      <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">📸</div>
      
      <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 16px; text-align: center;">
        ${firstName}, ta photo t'attend !
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
        ${urgencyMessage}
      </p>

      <div style="background: linear-gradient(135deg, #fef3f2 0%, #f5f3ff 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 16px; text-align: center;">
          📊 Le saviez-vous ?
        </h3>
        <div style="color: #475569; font-size: 15px; line-height: 1.8;">
          <p style="margin: 0 0 12px;">
            ✅ Les profils <strong>avec photo</strong> reçoivent <strong style="color: #f43f5e;">10x plus de likes</strong>
          </p>
          <p style="margin: 0 0 12px;">
            ✅ <strong>95% des membres</strong> ne swipent que les profils avec photo
          </p>
          <p style="margin: 0;">
            ✅ Une photo souriante augmente tes matchs de <strong>+300%</strong>
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${SITE_URL}/welcome" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 17px;">
          Ajouter ma photo maintenant 📸
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0;">
        Ça prend moins de 2 minutes ⚡
      </p>
    </div>
    ${baseFooter}
  `;
}
// ============================================
// 🎯 EMAILS RELANCE PROFIL INCOMPLET
// ============================================

export async function sendIncompleteProfileEmail3d(
  email: string,
  firstName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9f9f9;">
      <div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);padding:40px 20px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">📸 ${firstName}, ton profil t'attend !</h1>
        </div>
        <div style="padding:30px 20px;">
          <p style="font-size:16px;color:#333;line-height:1.6;">
            Salut <strong>${firstName}</strong>,
          </p>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            On a remarqué que <strong>ton profil n'est pas encore complet</strong>. 
            Sans photo, tu ne peux pas apparaître dans les recherches et personne ne peut te découvrir 😢
          </p>
          <div style="background:#fef3f2;border-left:4px solid #f43f5e;padding:16px;margin:20px 0;border-radius:8px;">
            <p style="margin:0;font-size:14px;color:#7f1d1d;">
              ⏱️ <strong>30 secondes suffisent</strong> pour compléter ton profil et commencer à recevoir des likes !
            </p>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://lovelink237.com/profile" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;box-shadow:0 4px 12px rgba(244,63,94,0.3);">
              Compléter mon profil →
            </a>
          </div>
          <p style="font-size:14px;color:#666;text-align:center;">
            À très vite ! 💕<br/>L'équipe LoveLink
          </p>
        </div>
        <div style="background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;">
          © 2026 LoveLink - Site de rencontres africain
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `📸 ${firstName}, ton profil t'attend !`,
    html,
  });
}

export async function sendIncompleteProfileEmail7d(
  email: string,
  firstName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9f9f9;">
      <div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);padding:40px 20px;text-align:center;">
          <div style="font-size:60px;margin-bottom:10px;">🎁</div>
          <h1 style="color:white;margin:0;font-size:32px;">7 JOURS PREMIUM OFFERTS !</h1>
        </div>
        <div style="padding:30px 20px;">
          <p style="font-size:18px;color:#333;line-height:1.6;">
            Salut <strong>${firstName}</strong>,
          </p>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            On veut vraiment t'aider à trouver l'amour ! 💕<br/>
            C'est pourquoi on t'offre <strong style="color:#f59e0b;">7 JOURS PREMIUM GRATUITS</strong> si tu complètes ton profil aujourd'hui.
          </p>
          <div style="background:linear-gradient(135deg,#fef3c7 0%,#fed7aa 100%);padding:20px;margin:20px 0;border-radius:12px;border:2px dashed #f59e0b;">
            <h3 style="margin:0 0 12px;color:#78350f;">💎 Ce que Premium t'offre :</h3>
            <ul style="margin:0;padding-left:20px;color:#78350f;line-height:1.8;">
              <li>Likes ILLIMITÉS 💕</li>
              <li>Voir qui t'a liké 👀</li>
              <li>5 Super Likes / jour ⭐</li>
              <li>Boosts 3x / jour 🚀</li>
              <li>Mode Incognito 🕵️</li>
            </ul>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://lovelink237.com/profile" style="display:inline-block;padding:18px 45px;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;box-shadow:0 6px 20px rgba(245,158,11,0.4);">
              🎁 Débloquer mon cadeau
            </a>
          </div>
          <p style="font-size:13px;color:#666;text-align:center;">
            ⏰ Offre valable si tu complètes ton profil dans les 48h
          </p>
        </div>
        <div style="background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;">
          © 2026 LoveLink 💕
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `🎁 ${firstName}, 7 jours Premium OFFERTS !`,
    html,
  });
}

export async function sendIncompleteProfileEmail14d(
  email: string,
  firstName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9f9f9;">
      <div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#7c2d12 0%,#991b1b 100%);padding:40px 20px;text-align:center;">
          <div style="font-size:60px;margin-bottom:10px;">💔</div>
          <h1 style="color:white;margin:0;font-size:28px;">Dernière chance ${firstName}...</h1>
        </div>
        <div style="padding:30px 20px;">
          <p style="font-size:16px;color:#333;line-height:1.6;">
            Salut <strong>${firstName}</strong>,
          </p>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            Cela fait maintenant <strong>14 jours</strong> que tu t'es inscrit(e) sur LoveLink, 
            mais ton profil est toujours incomplet.
          </p>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin:20px 0;border-radius:8px;">
            <p style="margin:0;font-size:15px;color:#7f1d1d;font-weight:bold;">
              ⚠️ Sans action de ta part dans les 7 prochains jours, ton compte sera supprimé.
            </p>
          </div>
          <p style="font-size:16px;color:#333;line-height:1.6;">
            Ne rate pas cette occasion de trouver l'amour ! Des centaines de personnes attendent de te découvrir 💕
          </p>
          <div style="background:#fef3c7;padding:16px;margin:20px 0;border-radius:8px;text-align:center;">
            <p style="margin:0;font-size:14px;color:#78350f;">
              🎁 <strong>Toujours 7 JOURS PREMIUM offerts</strong> si tu complètes maintenant !
            </p>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://lovelink237.com/profile" style="display:inline-block;padding:18px 45px;background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;box-shadow:0 6px 20px rgba(244,63,94,0.4);">
              💪 Sauver mon compte
            </a>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;">
          © 2026 LoveLink 💕
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `💔 ${firstName}, dernière chance pour ton compte...`,
    html,
  });
}
