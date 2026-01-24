import { useEffect, useState } from 'react'
import { monteurService } from '../services/monteurService'
import { Monteur, PaginationMeta } from '../types'
import { Plus, Search, Phone, Mail, Loader2, Users, Archive, Trash2, RefreshCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { MonteurForm } from '../components/MonteurForm'
import { MonteurDetail } from '../components/MonteurDetail'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'

export const Monteurs = () => {
  const [loading, setLoading] = useState(true)
  const [monteurs, setMonteurs] = useState<Monteur[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [showActifsOnly, setShowActifsOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonteur, setSelectedMonteur] = useState<Monteur | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const result = await monteurService.getAll(
        showActifsOnly ? true : undefined,
        page,
        20
      )

      if ('pagination' in result) {
        setMonteurs(result.data)
        setPagination(result.pagination)
      } else {
        // Fallback pour compatibilité
        setMonteurs(result)
        setPagination({
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        })
      }
    } catch (error) {
      console.error('Erreur chargement monteurs:', error)
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
  const filteredMonteurs = monteurs.filter((monteur) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      monteur.nom.toLowerCase().includes(searchLower) ||
      monteur.prenom.toLowerCase().includes(searchLower) ||
      monteur.email.toLowerCase().includes(searchLower) ||
      monteur.numeroIdentification.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const handleOpenModal = (monteur?: Monteur) => {
    setSelectedMonteur(monteur)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMonteur(undefined)
  }

  const handleViewDetail = (monteur: Monteur) => {
    setSelectedId(monteur.id)
    setDetailModalOpen(true)
  }

  const handleSubmit = async (data: Partial<Monteur>) => {
    try {
      setIsSubmitting(true)
      if (selectedMonteur) {
        await monteurService.update(selectedMonteur.id, data)
        showToast('Monteur modifie avec succes', 'success')
      } else {
        await monteurService.create(data)
        showToast('Monteur cree avec succes', 'success')
      }
      handleCloseModal()
      await fetchData(pagination.page) // Rafraîchir la page actuelle
    } catch (error: any) {
      console.error('Erreur sauvegarde monteur:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde'
      showToast(errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchive = async (monteur: Monteur) => {
    try {
      const newStatus = !monteur.actif
      await monteurService.update(monteur.id, { actif: newStatus })
      showToast(
        `Monteur ${newStatus ? 'désarchivé' : 'archivé'} avec succès`,
        'success'
      )
      await fetchData(pagination.page)
    } catch (error: any) {
      console.error('Erreur archivage:', error)
      showToast("Erreur lors de l'archivage", 'error')
    }
  }

  const handleDelete = async (monteur: Monteur) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ${monteur.prenom} ${monteur.nom} ?\nCette action est irréversible.`
      )
    ) {
      return
    }

    try {
      await monteurService.delete(monteur.id)
      showToast('Monteur supprimé avec succès', 'success')
      await fetchData(pagination.page)
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      // Message spécifique si contrainte d'intégrité (P2003 de Prisma souvent mappé en 500 ou 400 par le backend)
      const message = error.response?.data?.message || ''
      if (
        message.includes('constraint') ||
        message.includes('Foreign key') ||
        // Si le backend renvoie l'erreur brute Prisma
        message.includes('P2003')
      ) {
        showToast(
          'Impossible de supprimer ce monteur car il a des feuilles de travail associées. Veuillez l\'archiver à la place.',
          'error'
        )
      } else {
        showToast('Erreur lors de la suppression', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Monteurs</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Ajouter un monteur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un monteur..."
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
          ) : filteredMonteurs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Aucun monteur trouve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMonteurs.map((monteur) => (
                <div key={monteur.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {monteur.prenom.charAt(0)}{monteur.nom.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {monteur.prenom} {monteur.nom}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${monteur.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {monteur.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{monteur.numeroIdentification}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={16} className="shrink-0" />
                      <span className="truncate">{monteur.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={16} className="shrink-0" />
                      <span className="truncate">{monteur.telephone}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>Embauche le {formatDate(monteur.dateEmbauche)}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleArchive(monteur)}
                        className={`p-2 text-sm border rounded-lg hover:bg-gray-50 ${!monteur.actif ? 'text-green-600' : 'text-orange-600'
                          }`}
                        title={monteur.actif ? 'Archiver' : 'Désarchiver'}
                      >
                        {monteur.actif ? <Archive size={16} /> : <RefreshCcw size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(monteur)}
                        className="p-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(monteur)}
                        className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        Voir profil
                      </button>
                      <button
                        onClick={() => handleOpenModal(monteur)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && filteredMonteurs.length > 0 && (
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
        title={selectedMonteur ? 'Modifier le monteur' : 'Nouveau monteur'}
      >
        <MonteurForm
          monteur={selectedMonteur}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Profil du monteur"
        size="xl"
      >
        {selectedId && (
          <MonteurDetail
            monteurId={selectedId}
            onClose={() => setDetailModalOpen(false)}
          />
        )}
      </Modal>
    </div >
  )
}
