import { useEffect, useState } from 'react'
import { chantierService } from '../services/chantierService'
import { Chantier } from '../types'
import { Building, MapPin, Calendar, Loader2, Clock, FileText, Euro, Users } from 'lucide-react'

interface ChantierStats {
  heuresTotales: number
  nombreFeuilles: number
  fraisTotaux: number
  nombreMonteurs: number
  feuillesRecentes: {
    id: string
    dateTravail: string
    heuresTotales: number
    statut: string
    monteur: {
      prenom: string
      nom: string
      numeroIdentification: string
    }
  }[]
}

interface ChantierDetailProps {
  chantierId: string
  onClose: () => void
}

const getStatusBadge = (statut: string) => {
  switch (statut) {
    case 'VALIDE':
      return 'bg-green-100 text-green-700'
    case 'SOUMIS':
      return 'bg-yellow-100 text-yellow-700'
    case 'REJETE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

export const ChantierDetail = ({ chantierId, onClose }: ChantierDetailProps) => {
  const [loading, setLoading] = useState(true)
  const [chantier, setChantier] = useState<Chantier | null>(null)
  const [stats, setStats] = useState<ChantierStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const calculateDuration = () => {
    if (!chantier) return ''
    const start = new Date(chantier.dateDebut)
    const end = chantier.dateFin ? new Date(chantier.dateFin) : new Date()
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (days < 30) return `${days} jour(s)`
    if (days < 365) return `${Math.floor(days / 30)} mois`
    return `${Math.floor(days / 365)} an(s)`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Récupérer les données en parallèle
        const [chantierData, statsData] = await Promise.all([
          chantierService.getById(chantierId),
          chantierService.getStats(chantierId),
        ])

        setChantier(chantierData)
        setStats(statsData)
      } catch (err) {
        console.error('Erreur chargement détail chantier:', err)
        setError('Impossible de charger les informations du chantier')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chantierId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  if (error || !chantier) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Chantier introuvable'}</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
          <Building className="text-purple-600" size={32} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-900">{chantier.nom}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              chantier.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {chantier.actif ? 'En cours' : 'Terminé'}
            </span>
          </div>
          <p className="text-gray-500">{chantier.reference}</p>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Building className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Client</p>
            <p className="font-medium">{chantier.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Adresse</p>
            <p className="font-medium">{chantier.adresse}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Période</p>
            <p className="font-medium">
              {formatDate(chantier.dateDebut)}
              {chantier.dateFin ? ` - ${formatDate(chantier.dateFin)}` : ' - En cours'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Durée</p>
            <p className="font-medium">{calculateDuration()}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {chantier.description && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{chantier.description}</p>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      {stats && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Statistiques globales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.heuresTotales}h</p>
                  <p className="text-xs text-gray-600">Heures totales</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                    <FileText className="text-green-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.nombreFeuilles}</p>
                  <p className="text-xs text-gray-600">Feuilles créées</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <Euro className="text-purple-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.fraisTotaux.toFixed(2)} EUR</p>
                  <p className="text-xs text-gray-600">Frais totaux</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                    <Users className="text-orange-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.nombreMonteurs}</p>
                  <p className="text-xs text-gray-600">Monteurs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline d'activité */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Timeline d'activité</h4>
            {stats.feuillesRecentes.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Monteur</th>
                      <th className="px-4 py-3 text-left">Heures</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.feuillesRecentes.map((feuille) => (
                      <tr key={feuille.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(feuille.dateTravail)}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{feuille.monteur.prenom} {feuille.monteur.nom}</p>
                            <p className="text-xs text-gray-500">{feuille.monteur.numeroIdentification}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{feuille.heuresTotales}h</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(feuille.statut)}`}>
                            {feuille.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
