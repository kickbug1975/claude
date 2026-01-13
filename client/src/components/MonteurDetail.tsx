import { useEffect, useState } from 'react'
import { monteurService } from '../services/monteurService'
import { Monteur } from '../types'
import { Mail, Phone, MapPin, Calendar, Loader2, Clock, FileText, Euro } from 'lucide-react'

interface MonteurStats {
  heuresTotales: number
  nombreFeuilles: number
  fraisTotaux: number
  feuillesRecentes: {
    id: string
    dateTravail: string
    heuresTotales: number
    statut: string
    chantier: {
      nom: string
      reference: string
    }
  }[]
}

interface MonteurDetailProps {
  monteurId: string
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

export const MonteurDetail = ({ monteurId, onClose }: MonteurDetailProps) => {
  const [loading, setLoading] = useState(true)
  const [monteur, setMonteur] = useState<Monteur | null>(null)
  const [stats, setStats] = useState<MonteurStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Récupérer les données en parallèle
        const [monteurData, statsData] = await Promise.all([
          monteurService.getById(monteurId),
          monteurService.getStats(monteurId), // Mois en cours par défaut
        ])

        setMonteur(monteurData)
        setStats(statsData)
      } catch (err) {
        console.error('Erreur chargement profil monteur:', err)
        setError('Impossible de charger les informations du monteur')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [monteurId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  if (error || !monteur) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Monteur introuvable'}</p>
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
      {/* Header avec Avatar */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
          {monteur.prenom.charAt(0)}{monteur.nom.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-900">
              {monteur.prenom} {monteur.nom}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              monteur.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {monteur.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="text-gray-500">{monteur.numeroIdentification}</p>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Mail className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{monteur.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Téléphone</p>
            <p className="font-medium">{monteur.telephone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Adresse</p>
            <p className="font-medium">{monteur.adresse}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-400" size={20} />
          <div>
            <p className="text-xs text-gray-500">Date d'embauche</p>
            <p className="font-medium">{formatDate(monteur.dateEmbauche)}</p>
          </div>
        </div>
      </div>

      {/* Statistiques mois en cours */}
      {stats && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Statistiques du mois en cours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.heuresTotales}h</p>
                    <p className="text-sm text-gray-600">Heures travaillées</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.nombreFeuilles}</p>
                    <p className="text-sm text-gray-600">Feuilles créées</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Euro className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.fraisTotaux.toFixed(2)} EUR</p>
                    <p className="text-sm text-gray-600">Frais engagés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Activité récente</h4>
            {stats.feuillesRecentes.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Chantier</th>
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
                            <p className="font-medium">{feuille.chantier.nom}</p>
                            <p className="text-xs text-gray-500">{feuille.chantier.reference}</p>
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
