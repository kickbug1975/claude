import nodemailer from 'nodemailer'
import { env } from '../config/env'
import { logger } from '../utils/logger'

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
})

// Verifier la configuration au demarrage
export const verifyEmailConfig = async (): Promise<boolean> => {
  if (!env.smtp.user || !env.smtp.password) {
    logger.warn('Configuration SMTP incomplete - les emails sont desactives')
    return false
  }

  try {
    await transporter.verify()
    logger.info('Service email configure et pret')
    return true
  } catch (error) {
    logger.warn('Service email non disponible', { error })
    return false
  }
}

// Interface pour les donnees de feuille
interface FeuilleEmailData {
  id: string
  monteurNom: string
  monteurPrenom: string
  monteurEmail: string
  chantierNom: string
  chantierReference: string
  dateTravail: Date
  heureDebut: string
  heureFin: string
  heuresTotales: number
  descriptionTravail: string
  totalFrais?: number
}

// Interface pour les superviseurs
interface SuperviseurData {
  email: string
  nom?: string
}

// Fonction utilitaire pour formater la date
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Template de base HTML
const baseTemplate = (content: string, title: string): string => `
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
`

// Template pour notification de soumission (aux superviseurs)
const submissionTemplate = (data: FeuilleEmailData): string => {
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
        <a href="${env.clientUrl}/feuilles" class="btn">Voir la feuille</a>
      </p>
    </div>
  `
  return baseTemplate(content, 'Nouvelle Feuille Soumise')
}

// Template pour confirmation de soumission (au monteur)
const submissionConfirmationTemplate = (data: FeuilleEmailData): string => {
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
  `
  return baseTemplate(content, 'Feuille Soumise')
}

// Template pour validation (au monteur)
const validationTemplate = (data: FeuilleEmailData, validePar: string): string => {
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
  `
  return baseTemplate(content, 'Feuille Validee')
}

// Template pour rejet (au monteur)
const rejectionTemplate = (data: FeuilleEmailData, rejetePar: string, motif?: string): string => {
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
        <a href="${env.clientUrl}/feuilles" class="btn" style="background: #dc2626;">Modifier la feuille</a>
      </p>
    </div>
  `
  return baseTemplate(content, 'Feuille Rejetee')
}

// Fonction d'envoi d'email
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  if (!env.smtp.user || !env.smtp.password) {
    logger.info(`Email non envoye (SMTP non configure): ${subject} -> ${to}`)
    return false
  }

  try {
    await transporter.sendMail({
      from: `"Gestion Feuilles de Travail" <${env.smtp.from}>`,
      to,
      subject,
      html,
    })
    logger.info(`Email envoye: ${subject} -> ${to}`)
    return true
  } catch (error) {
    logger.error(`Erreur envoi email a ${to}:`, error)
    return false
  }
}

// Services d'envoi specifiques
export const emailService = {
  // Notifier les superviseurs d'une nouvelle soumission
  notifySubmission: async (data: FeuilleEmailData, superviseurs: SuperviseurData[]): Promise<void> => {
    // Email au monteur (confirmation)
    await sendEmail(
      data.monteurEmail,
      `Feuille soumise - ${data.chantierNom} - ${formatDate(data.dateTravail)}`,
      submissionConfirmationTemplate(data)
    )

    // Emails aux superviseurs
    for (const sup of superviseurs) {
      await sendEmail(
        sup.email,
        `[Action requise] Nouvelle feuille a valider - ${data.monteurPrenom} ${data.monteurNom}`,
        submissionTemplate(data)
      )
    }
  },

  // Notifier le monteur d'une validation
  notifyValidation: async (data: FeuilleEmailData, validePar: string): Promise<void> => {
    await sendEmail(
      data.monteurEmail,
      `Feuille validee - ${data.chantierNom} - ${formatDate(data.dateTravail)}`,
      validationTemplate(data, validePar)
    )
  },

  // Notifier le monteur d'un rejet
  notifyRejection: async (data: FeuilleEmailData, rejetePar: string, motif?: string): Promise<void> => {
    await sendEmail(
      data.monteurEmail,
      `[Action requise] Feuille rejetee - ${data.chantierNom} - ${formatDate(data.dateTravail)}`,
      rejectionTemplate(data, rejetePar, motif)
    )
  },
}

export type { FeuilleEmailData, SuperviseurData }
