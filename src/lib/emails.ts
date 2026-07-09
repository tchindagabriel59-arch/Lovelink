import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ En mode test Resend, on utilise "onboarding@resend.dev"
// Quand tu auras un domaine, remplace par "noreply@tondomaine.com"
const FROM_EMAIL = "LoveLink <onboarding@resend.dev>";

// ⚠️ En mode test, tous les emails vont à ton email admin
// Quand tu auras un domaine, mets à false pour envoyer aux vrais utilisateurs
const TEST_MODE = true;
const TEST_EMAIL = "lovelink237@gmail.com";

function getRecipient(userEmail: string): string {
  return TEST_MODE ? TEST_EMAIL : userEmail;
}

// 📧 Email de bienvenue
export async function sendWelcomeEmail(
  userEmail: string,
  firstName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: getRecipient(userEmail),
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
      to: getRecipient(userEmail),
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
      to: getRecipient(userEmail),
      subject: `💬 Nouveau message de ${senderFirstName}`,
      html: messageEmailTemplate(userFirstName, senderFirstName),
    });

    if (error) return { success: false, error };
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
        <a href="https://lovelink-omega.vercel.app/cgu" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">CGU</a>
        <a href="https://lovelink-omega.vercel.app/confidentialite" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">Confidentialité</a>
        <a href="mailto:lovelink237@gmail.com" style="color: #94a3b8; font-size: 12px; margin: 0 8px; text-decoration: none;">Contact</a>
      </div>
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
        <a href="https://lovelink-omega.vercel.app/profile" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
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
        <a href="https://lovelink-omega.vercel.app/messages" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
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
        <a href="https://lovelink-omega.vercel.app/messages" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
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
