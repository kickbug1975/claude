import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { feuilleService } from '../services/feuilleService'
import { monteurService } from '../services/monteurService'
import { chantierService } from '../services/chantierService'
import { FeuilleTravail, Monteur, Chantier } from '../types'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  loading?: boolean
}

const StatCard = ({ title, value, icon, color, loading }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        {loading ? (
          <Loader2 className="animate-spin mt-2" size={24} />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
)

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

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [monteurs, setMonteurs] = useState<Monteur[]>([])
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [feuilles, setFeuilles] = useState<FeuilleTravail[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monteursResult, chantiersResult, feuillesResult] = await Promise.all([
          monteurService.getAll(),
          chantierService.getAll(),
          feuilleService.getAll(),
        ])

        // Gérer la réponse paginée ou non
        const monteursData = 'pagination' in monteursResult ? monteursResult.data : monteursResult
        const chantiersData = 'pagination' in chantiersResult ? chantiersResult.data : chantiersResult
        const feuillesData = 'pagination' in feuillesResult ? feuillesResult.data : feuillesResult

        setMonteurs(monteursData)
        setChantiers(chantiersData)
        setFeuilles(feuillesData)
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const monteursActifs = monteurs.filter((m) => m.actif).length
  const chantiersActifs = chantiers.filter((c) => c.actif).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Vue Administrateur</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monteurs"
          value={monteurs.length}
          icon={<Users className="text-blue-600" size={24} />}
          color="bg-blue-100"
          loading={loading}
        />
        <StatCard
          title="Monteurs Actifs"
          value={monteursActifs}
          icon={<Users className="text-green-600" size={24} />}
          color="bg-green-100"
          loading={loading}
        />
        <StatCard
          title="Chantiers Actifs"
          value={chantiersActifs}
          icon={<Building2 className="text-purple-600" size={24} />}
          color="bg-purple-100"
          loading={loading}
        />
        <StatCard
          title="Total Feuilles"
          value={feuilles.length}
          icon={<FileText className="text-orange-600" size={24} />}
          color="bg-orange-100"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Dernieres feuilles</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {feuilles.slice(0, 5).map((feuille) => (
                <div key={feuille.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{feuille.monteur?.prenom} {feuille.monteur?.nom}</p>
                    <p className="text-sm text-gray-500">{feuille.chantier?.nom}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(feuille.statut)}`}>
                      {feuille.statut}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(feuille.dateTravail)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Chantiers actifs</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {chantiers.filter((c) => c.actif).slice(0, 5).map((chantier) => (
                <div key={chantier.id} className="flex items-center gap-3 py-2 border-b">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{chantier.nom}</p>
                    <p className="text-sm text-gray-500">{chantier.client}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SuperviseurDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [feuilles, setFeuilles] = useState<FeuilleTravail[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await feuilleService.getAll()
        const data = 'pagination' in result ? result.data : result
        setFeuilles(data)
      } catch (error) {
        console.error('Erreur chargement feuilles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleValidate = async (id: string) => {
    try {
      await feuilleService.validate(id)
      setFeuilles(feuilles.map((f) => (f.id === id ? { ...f, statut: 'VALIDE' as const } : f)))
    } catch (error) {
      console.error('Erreur validation:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await feuilleService.reject(id)
      setFeuilles(feuilles.map((f) => (f.id === id ? { ...f, statut: 'REJETE' as const } : f)))
    } catch (error) {
      console.error('Erreur rejet:', error)
    }
  }

  const enAttente = feuilles.filter((f) => f.statut === 'SOUMIS')
  const validees = feuilles.filter((f) => f.statut === 'VALIDE')
  const rejetees = feuilles.filter((f) => f.statut === 'REJETE')
  const heuresTotal = feuilles.reduce((acc, f) => acc + f.heuresTotales, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Vue Superviseur</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="En attente"
          value={enAttente.length}
          icon={<AlertCircle className="text-yellow-600" size={24} />}
          color="bg-yellow-100"
          loading={loading}
        />
        <StatCard
          title="Validees"
          value={validees.length}
          icon={<CheckCircle className="text-green-600" size={24} />}
          color="bg-green-100"
          loading={loading}
        />
        <StatCard
          title="Rejetees"
          value={rejetees.length}
          icon={<XCircle className="text-red-600" size={24} />}
          color="bg-red-100"
          loading={loading}
        />
        <StatCard
          title="Heures totales"
          value={`${heuresTotal}h`}
          icon={<Clock className="text-blue-600" size={24} />}
          color="bg-blue-100"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Feuilles en attente de validation</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : enAttente.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune feuille en attente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Monteur</th>
                  <th className="pb-3">Chantier</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Heures</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enAttente.map((feuille) => (
                  <tr key={feuille.id} className="border-b">
                    <td className="py-3">{feuille.monteur?.prenom} {feuille.monteur?.nom}</td>
                    <td className="py-3">{feuille.chantier?.nom}</td>
                    <td className="py-3">{formatDate(feuille.dateTravail)}</td>
                    <td className="py-3">{feuille.heuresTotales}h</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidate(feuille.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(feuille.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const MonteurDashboard = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [feuilles, setFeuilles] = useState<FeuilleTravail[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await feuilleService.getAll()
        const data = 'pagination' in result ? result.data : result
        setFeuilles(data)
      } catch (error) {
        console.error('Erreur chargement feuilles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const mesFeuilles = feuilles.length
  const heuresTotal = feuilles.reduce((acc, f) => acc + f.heuresTotales, 0)
  const enAttente = feuilles.filter((f) => f.statut === 'SOUMIS').length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Bienvenue, {user?.monteur?.prenom || 'Monteur'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mes feuilles"
          value={mesFeuilles}
          icon={<FileText className="text-blue-600" size={24} />}
          color="bg-blue-100"
          loading={loading}
        />
        <StatCard
          title="Heures totales"
          value={`${heuresTotal}h`}
          icon={<Clock className="text-green-600" size={24} />}
          color="bg-green-100"
          loading={loading}
        />
        <StatCard
          title="En attente"
          value={enAttente}
          icon={<AlertCircle className="text-yellow-600" size={24} />}
          color="bg-yellow-100"
          loading={loading}
        />
        <StatCard
          title="Ce mois"
          value={`${heuresTotal}h`}
          icon={<TrendingUp className="text-purple-600" size={24} />}
          color="bg-purple-100"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Mes dernieres feuilles</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : feuilles.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune feuille</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Chantier</th>
                  <th className="pb-3">Heures</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {feuilles.slice(0, 5).map((feuille) => (
                  <tr key={feuille.id} className="border-b">
                    <td className="py-3">{formatDate(feuille.dateTravail)}</td>
                    <td className="py-3">{feuille.chantier?.nom}</td>
                    <td className="py-3">{feuille.heuresTotales}h</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadge(feuille.statut)}`}>
                        {feuille.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export const Dashboard = () => {
  const { user } = useAuthStore()

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />
    case 'SUPERVISEUR':
      return <SuperviseurDashboard />
    case 'MONTEUR':
      return <MonteurDashboard />
    default:
      return <MonteurDashboard />
  }
}
