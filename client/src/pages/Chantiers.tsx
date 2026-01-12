import { useEffect, useState } from 'react'
import { chantierService } from '../services/chantierService'
import { Chantier } from '../types'
import { Plus, Search, MapPin, Calendar, Building, Loader2 } from 'lucide-react'

export const Chantiers = () => {
  const [loading, setLoading] = useState(true)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [search, setSearch] = useState('')
  const [showActifsOnly, setShowActifsOnly] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await chantierService.getAll(showActifsOnly ? true : undefined)
        setChantiers(data)
      } catch (error) {
        console.error('Erreur chargement chantiers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showActifsOnly])

  const filteredChantiers = chantiers.filter((chantier) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      chantier.nom.toLowerCase().includes(searchLower) ||
      chantier.client.toLowerCase().includes(searchLower) ||
      chantier.reference.toLowerCase().includes(searchLower) ||
      chantier.adresse.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Chantiers</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Ajouter un chantier
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un chantier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActifsOnly}
              onChange={(e) => setShowActifsOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Actifs uniquement</span>
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : filteredChantiers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Aucun chantier trouve</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChantiers.map((chantier) => (
              <div key={chantier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Building className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{chantier.nom}</h3>
                        <p className="text-sm text-gray-500">{chantier.reference}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        chantier.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {chantier.actif ? 'Actif' : 'Termine'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{chantier.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{chantier.adresse}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span>
                          {formatDate(chantier.dateDebut)}
                          {chantier.dateFin ? ` - ${formatDate(chantier.dateFin)}` : ' - En cours'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-sm">
                      <span className="text-gray-500">Client:</span>{' '}
                      <span className="font-medium">{chantier.client}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                      Voir details
                    </button>
                    <button className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredChantiers.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            {filteredChantiers.length} chantier(s)
          </div>
        )}
      </div>
    </div>
  )
}
