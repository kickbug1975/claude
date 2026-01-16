import { jsPDF } from 'jspdf'
import { FeuilleTravail } from '../types'

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

// Helper pour charger une image depuis une URL
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('Impossible de créer le contexte canvas'))
      }
    }
    img.onerror = (_e) => reject(new Error(`Erreur chargement image: ${url}`))
    img.src = url
  })
}

export const exportFeuilleToPDF = async (feuille: FeuilleTravail, companyInfo?: any) => {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // 1. Logo et Header
  if (companyInfo?.companyLogoUrl) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const logoUrl = `${baseUrl}${companyInfo.companyLogoUrl}`

      const imgData = await loadImage(logoUrl)
      // Ratio 2:1 pour le logo, hauteur 20mm
      doc.addImage(imgData, 'PNG', 20, y, 40, 0) // Width 40, auto height

      // Infos entreprise à côté
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(companyInfo.name || '', 70, y + 5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      let infoY = y + 10
      if (companyInfo.address) {
        doc.text(companyInfo.address, 70, infoY)
        infoY += 5
      }
      if (companyInfo.email) {
        doc.text(companyInfo.email, 70, infoY)
        infoY += 5
      }
      if (companyInfo.phone) {
        doc.text(companyInfo.phone, 70, infoY)
      }

      y += 30 // Espace réservé pour le header
    } catch (error) {
      console.error('Erreur ajout logo PDF:', error)
      // Fallback si erreur logo
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Feuille de Travail', pageWidth / 2, y, { align: 'center' })
      y += 15
    }
  } else {
    // Header standard sans logo
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Feuille de Travail', pageWidth / 2, y, { align: 'center' })
    y += 15
  }

  // Titre si logo présent (sinon déjà affiché)
  if (companyInfo?.companyLogoUrl) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Feuille de Travail', pageWidth / 2, y, { align: 'center' })
    y += 10
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Reference: FT-${feuille.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, y, { align: 'center' })

  // Ligne de separation
  y += 10
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)

  // Informations principales
  y += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Informations Generales', 20, y)

  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Monteur
  doc.setFont('helvetica', 'bold')
  doc.text('Monteur:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${feuille.monteur?.prenom || ''} ${feuille.monteur?.nom || ''}`, 60, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('N° Identification:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(feuille.monteur?.numeroIdentification || '', 60, y)

  // Chantier
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Chantier:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(feuille.chantier?.nom || '', 60, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Reference:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(feuille.chantier?.reference || '', 60, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Adresse:', 20, y)
  doc.setFont('helvetica', 'normal')
  const adresse = feuille.chantier?.adresse || ''
  if (adresse.length > 60) {
    doc.text(adresse.substring(0, 60), 60, y)
    y += 5
    doc.text(adresse.substring(60), 60, y)
  } else {
    doc.text(adresse, 60, y)
  }

  // Date et horaires
  y += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Date et Horaires', 20, y)

  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Date de travail:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(feuille.dateTravail), 60, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Horaires:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${feuille.heureDebut} - ${feuille.heureFin}`, 60, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Heures totales:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${feuille.heuresTotales}h`, 60, y)

  // Description du travail
  y += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Description du Travail', 20, y)

  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const description = feuille.descriptionTravail || ''
  const descriptionLines = doc.splitTextToSize(description, pageWidth - 40)
  doc.text(descriptionLines, 20, y)
  y += descriptionLines.length * 5

  // Frais
  if (feuille.frais && feuille.frais.length > 0) {
    y += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Frais', 20, y)

    y += 10
    doc.setFontSize(9)

    // En-tete du tableau
    doc.setFillColor(240, 240, 240)
    doc.rect(20, y - 5, pageWidth - 40, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Type', 25, y)
    doc.text('Description', 70, y)
    doc.text('Montant', pageWidth - 45, y)

    y += 8
    doc.setFont('helvetica', 'normal')

    let totalFrais = 0
    feuille.frais.forEach((frais) => {
      doc.text(frais.typeFrais, 25, y)
      const fraisDesc = frais.description.length > 40
        ? frais.description.substring(0, 40) + '...'
        : frais.description
      doc.text(fraisDesc, 70, y)
      doc.text(`${frais.montant.toFixed(2)} EUR`, pageWidth - 45, y)
      totalFrais += frais.montant
      y += 7
    })

    // Total
    y += 3
    doc.setLineWidth(0.3)
    doc.line(20, y - 3, pageWidth - 20, y - 3)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', 70, y)
    doc.text(`${totalFrais.toFixed(2)} EUR`, pageWidth - 45, y)
  }

  // Statut
  y += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Statut:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(feuille.statut, 60, y)

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Document genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Telecharger le PDF
  const fileName = `feuille-travail-${feuille.id.substring(0, 8)}-${formatDate(feuille.dateTravail).replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}
