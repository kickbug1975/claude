import { useEffect, useState } from 'react'
import { feuilleService } from '../services/feuilleService'
import { FeuilleTravail, PaginationMeta } from '../types'
import { FileText, Plus, Search, Filter, Loader2, Eye, ChevronDown, Edit2, Download } from 'lucide-react'
import { Modal } from '../components/Modal'
import { FeuilleForm } from '../components/FeuilleForm'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'
import { exportFeuilleToPDF } from '../utils/pdfExport'
import { useAuthStore } from '../store/authStore'

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
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleTravail | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const { showToast } = useToast()

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const filters: { statut?: string; page?: number; limit?: number } = {
        page,
        limit: 20,
      }
      if (statusFilter) filters.statut = statusFilter

      const result = await feuilleService.getAll(filters)

      if ('pagination' in result) {
        setFeuilles(result.data)
        setPagination(result.pagination)
      } else {
        // Fallback pour compatibilité
        setFeuilles(result)
        setPagination({
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        })
      }
    } catch (error) {
      console.error('Erreur chargement feuilles:', error)
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1) // Réinitialiser à la page 1 quand le filtre change
  }, [statusFilter])

  const handlePageChange = (newPage: number) => {
    fetchData(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  const handleOpenModal = (feuille?: FeuilleTravail, view = false) => {
    setSelectedFeuille(feuille)
    setViewMode(view)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFeuille(undefined)
    setViewMode(false)
  }

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      if (selectedFeuille) {
        await feuilleService.update(selectedFeuille.id, {
          chantierId: data.chantierId,
          dateTravail: data.dateTravail,
          heureDebut: data.heureDebut,
          heureFin: data.heureFin,
          descriptionTravail: data.descriptionTravail,
        })
        showToast('Feuille modifiee avec succes', 'success')
      } else {
        await feuilleService.create(data)
        showToast('Feuille creee avec succes', 'success')
      }
      handleCloseModal()
      await fetchData(pagination.page) // Rafraîchir la page actuelle
    } catch (error) {
      console.error('Erreur sauvegarde feuille:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEdit = (feuille: FeuilleTravail) => {
    return feuille.statut === 'BROUILLON'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Feuilles de travail</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(feuille, true)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Eye size={16} />
                          Voir
                        </button>
                        {canEdit(feuille) && (
                          <button
                            onClick={() => handleOpenModal(feuille, false)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                          >
                            <Edit2 size={16} />
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredFeuilles.length > 0 && (
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
        title={
          viewMode
            ? 'Details de la feuille'
            : selectedFeuille
            ? 'Modifier la feuille'
            : 'Nouvelle feuille de travail'
        }
        size="xl"
      >
        {viewMode && selectedFeuille ? (
          <FeuilleDetail
            feuille={selectedFeuille}
            onClose={handleCloseModal}
            onRefresh={() => fetchData(pagination.page)}
            showToast={showToast}
            userRole={useAuthStore.getState().user?.role}
          />
        ) : (
          <FeuilleForm
            feuille={selectedFeuille}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  )
}

interface FeuilleDetailProps {
  feuille: FeuilleTravail
  onClose: () => void
  onRefresh: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  userRole?: string
}

const FeuilleDetail = ({ feuille, onClose, onRefresh, showToast, userRole }: FeuilleDetailProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vérifier si l'utilisateur peut valider/rejeter (Admin ou Superviseur)
  const canValidate = userRole === 'ADMIN' || userRole === 'SUPERVISEUR'

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await feuilleService.submit(feuille.id)
      showToast('Feuille soumise avec succes', 'success')
      onClose()
      onRefresh()
    } catch (error) {
      console.error('Erreur soumission:', error)
      showToast('Erreur lors de la soumission', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleValidate = async () => {
    try {
      setIsSubmitting(true)
      await feuilleService.validate(feuille.id)
      showToast('Feuille validee avec succes', 'success')
      onClose()
      onRefresh()
    } catch (error) {
      console.error('Erreur validation:', error)
      showToast('Erreur lors de la validation', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsSubmitting(true)
      await feuilleService.reject(feuille.id)
      showToast('Feuille rejetee', 'info')
      onClose()
      onRefresh()
    } catch (error) {
      console.error('Erreur rejet:', error)
      showToast('Erreur lors du rejet', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalFrais = feuille.frais?.reduce((acc, f) => acc + f.montant, 0) || 0

  const handleExportPDF = () => {
    try {
      exportFeuilleToPDF(feuille)
      showToast('PDF exporte avec succes', 'success')
    } catch (error) {
      console.error('Erreur export PDF:', error)
      showToast('Erreur lors de l\'export PDF', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Download size={16} />
          Exporter PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Monteur</p>
          <p className="font-medium">
            {feuille.monteur?.prenom} {feuille.monteur?.nom}
          </p>
          <p className="text-sm text-gray-500">{feuille.monteur?.numeroIdentification}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Chantier</p>
          <p className="font-medium">{feuille.chantier?.nom}</p>
          <p className="text-sm text-gray-500">{feuille.chantier?.reference}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Date</p>
          <p className="font-medium">{formatDate(feuille.dateTravail)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Horaires</p>
          <p className="font-medium">
            {feuille.heureDebut} - {feuille.heureFin}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Heures totales</p>
          <p className="font-medium">{feuille.heuresTotales}h</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">Description du travail</p>
        <p className="bg-gray-50 p-3 rounded-lg">{feuille.descriptionTravail}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">Statut</p>
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(feuille.statut)}`}>
          {feuille.statut}
        </span>
      </div>

      {feuille.frais && feuille.frais.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Frais ({feuille.frais.length})</p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {feuille.frais.map((frais) => (
                  <tr key={frais.id} className="border-t">
                    <td className="px-3 py-2">{frais.typeFrais}</td>
                    <td className="px-3 py-2">{frais.description}</td>
                    <td className="px-3 py-2 text-right">{frais.montant.toFixed(2)} EUR</td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-50 font-medium">
                  <td colSpan={2} className="px-3 py-2">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right">{totalFrais.toFixed(2)} EUR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Fermer
        </button>

        {feuille.statut === 'BROUILLON' && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            Soumettre
          </button>
        )}

        {feuille.statut === 'SOUMIS' && canValidate && (
          <>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
              Rejeter
            </button>
            <button
              onClick={handleValidate}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
              Valider
            </button>
          </>
        )}

        {feuille.statut === 'SOUMIS' && !canValidate && (
          <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            En attente de validation par un superviseur
          </div>
        )}
      </div>
    </div>
  )
}
