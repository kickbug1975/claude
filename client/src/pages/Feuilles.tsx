import { useEffect, useState } from 'react'
import { feuilleService } from '../services/feuilleService'
import { FeuilleTravail } from '../types'
import { FileText, Plus, Search, Filter, Loader2, Eye, ChevronDown } from 'lucide-react'

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

const calculateTotalFrais = (frais?: { montant: number }[]) => {
  if (!frais) return 0
  return frais.reduce((acc, f) => acc + f.montant, 0)
}

export const Feuilles = () => {
  const [loading, setLoading] = useState(true)
  const [feuilles, setFeuilles] = useState<FeuilleTravail[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filters: any = {}
        if (statusFilter) filters.statut = statusFilter
        const data = await feuilleService.getAll(filters)
        setFeuilles(data)
      } catch (error) {
        console.error('Erreur chargement feuilles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [statusFilter])

  const filteredFeuilles = feuilles.filter((feuille) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      feuille.monteur?.nom?.toLowerCase().includes(searchLower) ||
      feuille.monteur?.prenom?.toLowerCase().includes(searchLower) ||
      feuille.chantier?.nom?.toLowerCase().includes(searchLower) ||
      feuille.chantier?.reference?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Feuilles de travail</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Nouvelle feuille
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par monteur ou chantier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              Filtres
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous</option>
                    <option value="BROUILLON">Brouillon</option>
                    <option value="SOUMIS">Soumis</option>
                    <option value="VALIDE">Valide</option>
                    <option value="REJETE">Rejete</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : filteredFeuilles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Aucune feuille de travail trouvee</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Monteur</th>
                    <th className="px-4 py-3">Chantier</th>
                    <th className="px-4 py-3">Horaires</th>
                    <th className="px-4 py-3">Heures</th>
                    <th className="px-4 py-3">Frais</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeuilles.map((feuille) => (
                    <tr key={feuille.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDate(feuille.dateTravail)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{feuille.monteur?.prenom} {feuille.monteur?.nom}</p>
                          <p className="text-xs text-gray-500">{feuille.monteur?.numeroIdentification}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{feuille.chantier?.nom}</p>
                          <p className="text-xs text-gray-500">{feuille.chantier?.reference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{feuille.heureDebut} - {feuille.heureFin}</span>
                      </td>
                      <td className="px-4 py-3">{feuille.heuresTotales}h</td>
                      <td className="px-4 py-3">{calculateTotalFrais(feuille.frais).toFixed(2)} EUR</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadge(feuille.statut)}`}>
                          {feuille.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                          <Eye size={16} />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
              <span>{filteredFeuilles.length} feuille(s)</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
