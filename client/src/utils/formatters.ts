import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formate une date au format français
 */
export const formatDate = (date: string | Date, dateFormat = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, dateFormat, { locale: fr })
}

/**
 * Formate une date avec l'heure
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formate un montant en euros
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Calcule les heures entre deux heures (format HH:mm)
 */
export const calculateHoursDifference = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return (endMinutes - startMinutes) / 60
}

/**
 * Formate les heures en format lisible
 */
export const formatHours = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}
