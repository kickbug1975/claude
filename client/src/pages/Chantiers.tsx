import { useEffect, useState } from 'react'
import { chantierService } from '../services/chantierService'
import { Chantier, PaginationMeta } from '../types'
import { Plus, Search, MapPin, Calendar, Building, Loader2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { ChantierForm } from '../components/ChantierForm'
import { ChantierDetail } from '../components/ChantierDetail'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'

export const Chantiers = () => {
  const [loading, setLoading] = useState(true)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [showActifsOnly, setShowActifsOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChantier, setSelectedChantier] = useState<Chantier | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const result = await chantierService.getAll(
        showActifsOnly ? true : undefined,
        page,
        20
      )

      if ('pagination' in result) {
        setChantiers(result.data)
        setPagination(result.pagination)
      } else {
        // Fallback pour compatibilité
        setChantiers(result)
        setPagination({
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        })
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error)
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1) // Réinitialiser à la page 1 quand le filtre change
  }, [showActifsOnly])

  const handlePageChange = (newPage: number) => {
    fetchData(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // La recherche filtre uniquement la page courante
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

  const handleOpenModal = (chantier?: Chantier) => {
    setSelectedChantier(chantier)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedChantier(undefined)
  }

  const handleViewDetail = (chantier: Chantier) => {
    setSelectedId(chantier.id)
    setDetailModalOpen(true)
  }

  const handleSubmit = async (data: Partial<Chantier>) => {
    try {
      setIsSubmitting(true)
      if (selectedChantier) {
        await chantierService.update(selectedChantier.id, data)
        showToast('Chantier modifie avec succes', 'success')
      } else {
        await chantierService.create(data)
        showToast('Chantier cree avec succes', 'success')
      }
      handleCloseModal()
      await fetchData(pagination.page) // Rafraîchir la page actuelle
    } catch (error) {
      console.error('Erreur sauvegarde chantier:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Chantiers</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Ajouter un chantier
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChantiers.map((chantier) => (
                <div key={chantier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building className="text-purple-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{chantier.nom}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          chantier.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {chantier.actif ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{chantier.reference}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building size={16} />
                      <span className="truncate">{chantier.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="truncate">{chantier.adresse}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span>
                        {formatDate(chantier.dateDebut)}
                        {chantier.dateFin ? ` - ${formatDate(chantier.dateFin)}` : ' - En cours'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleViewDetail(chantier)}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Voir détails
                    </button>
                    <button
                      onClick={() => handleOpenModal(chantier)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && filteredChantiers.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            pageSize={pagination.pageSize}
            total={pagination.total}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
        size="lg"
      >
        <ChantierForm
          chantier={selectedChantier}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Détails du chantier"
        size="xl"
      >
        {selectedId && (
          <ChantierDetail
            chantierId={selectedId}
            onClose={() => setDetailModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  )
}
