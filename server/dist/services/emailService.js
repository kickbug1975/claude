"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.verifyEmailConfig = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Configuration du transporteur
// Transporteur global (sera (ré)initialisé si besoin)
let transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtp.host,
    port: env_1.env.smtp.port,
    secure: env_1.env.smtp.port === 465,
    auth: {
        user: env_1.env.smtp.user,
        pass: env_1.env.smtp.password,
    },
});
// Fonction pour initialiser Ethereal Email (développement/test)
const useEthereal = async () => {
    try {
        const testAccount = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        logger_1.logger.info('--- CONFIGURATION ETHEREAL EMAIL ACTIVÉE (Fallback) ---');
        logger_1.logger.info(`Utilisateur: ${testAccount.user}`);
        logger_1.logger.info(`Mot de passe: ${testAccount.pass}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('Impossible de configurer Ethereal Email:', error);
        return false;
    }
};
// Verifier la configuration au demarrage
const verifyEmailConfig = async () => {
    const isGmailConfigured = !!(env_1.env.smtp.user && env_1.env.smtp.password);
    if (!isGmailConfigured) {
        if (env_1.env.nodeEnv !== 'production') {
            logger_1.logger.info('Configuration SMTP manquante, tentative avec Ethereal...');
            return useEthereal();
        }
        logger_1.logger.warn('Configuration SMTP incomplete - les emails sont desactives');
        return false;
    }
    try {
        await transporter.verify();
        logger_1.logger.info('Service email configure et pret');
        return true;
    }
    catch (error) {
        if (env_1.env.nodeEnv !== 'production') {
            logger_1.logger.warn('SMTP configuré mais invalide (probablement Gmail 535), bascule vers Ethereal...');
            return useEthereal();
        }
        logger_1.logger.warn('Service email non disponible', { error });
        return false;
    }
};
exports.verifyEmailConfig = verifyEmailConfig;
// Fonction utilitaire pour formater la date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
// Template de base HTML
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { font-weight: bold; color: #6b7280; width: 140px; }
    .info-value { color: #111827; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
    .status-soumis { background: #fef3c7; color: #92400e; }
    .status-valide { background: #d1fae5; color: #065f46; }
    .status-rejete { background: #fee2e2; color: #991b1b; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Cet email a ete envoye automatiquement par le systeme de gestion des feuilles de travail.</p>
      <p>Merci de ne pas repondre a cet email.</p>
    </div>
  </div>
</body>
</html>
`;
// Template pour réinitialisation de mot de passe
const passwordResetTemplate = (email, resetUrl) => {
    const content = `
    <div class="header">
      <h1>Reinitialisation de mot de passe</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Vous avez demande la reinitialisation de votre mot de passe pour votre compte <strong>${email}</strong>.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant 1 heure.</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reinitialiser mon mot de passe</a>
      </p>
      
      <p>Si vous n'avez pas demande cette reinitialisation, vous pouvez ignorer cet email en toute securite. Votre mot de passe actuel restera inchangé.</p>
    </div>
  `;
    return baseTemplate(content, 'Réinitialisation de mot de passe');
};
// Template pour notification de soumission (aux superviseurs)
const submissionTemplate = (data) => {
    const content = `
    <div class="header">
      <h1>Nouvelle Feuille Soumise</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Une nouvelle feuille de travail a ete soumise et necessite votre validation.</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #374151;">Details de la feuille</h3>
        <div class="info-row">
          <span class="info-label">Reference:</span>
          <span class="info-value">FT-${data.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Monteur:</span>
          <span class="info-value">${data.monteurPrenom} ${data.monteurNom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chantier:</span>
          <span class="info-value">${data.chantierNom} (${data.chantierReference})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(data.dateTravail)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horaires:</span>
          <span class="info-value">${data.heureDebut} - ${data.heureFin} (${data.heuresTotales}h)</span>
        </div>
        ${data.totalFrais ? `
        <div class="info-row">
          <span class="info-label">Frais:</span>
          <span class="info-value">${data.totalFrais.toFixed(2)} EUR</span>
        </div>
        ` : ''}
      </div>

      <p><strong>Description du travail:</strong></p>
      <p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
        ${data.descriptionTravail}
      </p>

      <p style="text-align: center;">
        <a href="${env_1.env.clientUrl}/feuilles" class="btn">Voir la feuille</a>
      </p>
    </div>
  `;
    return baseTemplate(content, 'Nouvelle Feuille Soumise');
};
// Template pour confirmation de soumission (au monteur)
const submissionConfirmationTemplate = (data) => {
    const content = `
    <div class="header">
      <h1>Feuille Soumise</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.monteurPrenom},</p>
      <p>Votre feuille de travail a bien ete soumise et est en attente de validation.</p>

      <p style="text-align: center;">
        <span class="status-badge status-soumis">EN ATTENTE DE VALIDATION</span>
      </p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #374151;">Recapitulatif</h3>
        <div class="info-row">
          <span class="info-label">Reference:</span>
          <span class="info-value">FT-${data.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chantier:</span>
          <span class="info-value">${data.chantierNom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(data.dateTravail)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Heures:</span>
          <span class="info-value">${data.heuresTotales}h</span>
        </div>
      </div>

      <p>Vous recevrez une notification lorsque votre feuille sera validee ou si des modifications sont necessaires.</p>
    </div>
  `;
    return baseTemplate(content, 'Feuille Soumise');
};
// Template pour validation (au monteur)
const validationTemplate = (data, validePar) => {
    const content = `
    <div class="header" style="background: #059669;">
      <h1>Feuille Validee</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.monteurPrenom},</p>
      <p>Bonne nouvelle ! Votre feuille de travail a ete validee.</p>

      <p style="text-align: center;">
        <span class="status-badge status-valide">VALIDEE</span>
      </p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #374151;">Details</h3>
        <div class="info-row">
          <span class="info-label">Reference:</span>
          <span class="info-value">FT-${data.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chantier:</span>
          <span class="info-value">${data.chantierNom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(data.dateTravail)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Heures:</span>
          <span class="info-value">${data.heuresTotales}h</span>
        </div>
        <div class="info-row">
          <span class="info-label">Validee par:</span>
          <span class="info-value">${validePar}</span>
        </div>
      </div>

      <p>Merci pour votre travail !</p>
    </div>
  `;
    return baseTemplate(content, 'Feuille Validee');
};
// Template pour rejet (au monteur)
const rejectionTemplate = (data, rejetePar, motif) => {
    const content = `
    <div class="header" style="background: #dc2626;">
      <h1>Feuille Rejetee</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.monteurPrenom},</p>
      <p>Votre feuille de travail a ete rejetee et necessite des modifications.</p>

      <p style="text-align: center;">
        <span class="status-badge status-rejete">REJETEE</span>
      </p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #374151;">Details</h3>
        <div class="info-row">
          <span class="info-label">Reference:</span>
          <span class="info-value">FT-${data.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chantier:</span>
          <span class="info-value">${data.chantierNom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(data.dateTravail)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Rejetee par:</span>
          <span class="info-value">${rejetePar}</span>
        </div>
      </div>

      ${motif ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Motif du rejet:</strong></p>
        <p style="margin: 10px 0 0 0;">${motif}</p>
      </div>
      ` : ''}

      <p>Veuillez corriger les informations et soumettre a nouveau votre feuille.</p>

      <p style="text-align: center;">
        <a href="${env_1.env.clientUrl}/feuilles" class="btn" style="background: #dc2626;">Modifier la feuille</a>
      </p>
    </div>
  `;
    return baseTemplate(content, 'Feuille Rejetee');
};
// Fonction d'envoi d'email
const sendEmail = async (to, subject, html) => {
    if (!env_1.env.smtp.user || !env_1.env.smtp.password) {
        logger_1.logger.info(`Email non envoye (SMTP non configure): ${subject} -> ${to}`);
        return false;
    }
    try {
        const info = await transporter.sendMail({
            from: `"Gestion Feuilles de Travail" <${env_1.env.smtp.from}>`,
            to,
            subject,
            html,
        });
        logger_1.logger.info(`Email envoye: ${subject} -> ${to}`);
        // Si c'est un compte Ethereal, on logue l'URL de prévisualisation
        if (info.messageId && transporter.get('host') === 'smtp.ethereal.email') {
            logger_1.logger.info(`Aperçu de l'email Ethereal: ${nodemailer_1.default.getTestMessageUrl(info)}`);
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Erreur envoi email a ${to}:`, error);
        return false;
    }
};
// Services d'envoi specifiques
exports.emailService = {
    // Notifier les superviseurs d'une nouvelle soumission
    notifySubmission: async (data, superviseurs) => {
        // Email au monteur (confirmation)
        await sendEmail(data.monteurEmail, `Feuille soumise - ${data.chantierNom} - ${formatDate(data.dateTravail)}`, submissionConfirmationTemplate(data));
        // Emails aux superviseurs
        for (const sup of superviseurs) {
            await sendEmail(sup.email, `[Action requise] Nouvelle feuille a valider - ${data.monteurPrenom} ${data.monteurNom}`, submissionTemplate(data));
        }
    },
    // Notifier le monteur d'une validation
    notifyValidation: async (data, validePar) => {
        await sendEmail(data.monteurEmail, `Feuille validee - ${data.chantierNom} - ${formatDate(data.dateTravail)}`, validationTemplate(data, validePar));
    },
    // Notifier le monteur d'un rejet
    notifyRejection: async (data, rejetePar, motif) => {
        await sendEmail(data.monteurEmail, `[Action requise] Feuille rejetee - ${data.chantierNom} - ${formatDate(data.dateTravail)}`, rejectionTemplate(data, rejetePar, motif));
    },
    // Envoyer l'email de réinitialisation de mot de passe
    sendPasswordReset: async (email, resetToken) => {
        const resetUrl = `${env_1.env.clientUrl}/reset-password?token=${resetToken}`;
        return await sendEmail(email, 'Reinitialisation de votre mot de passe', passwordResetTemplate(email, resetUrl));
    },
};
//# sourceMappingURL=emailService.js.map