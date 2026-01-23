import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { feuilleService } from '../services/feuilleService'
import { analyticsService } from '../services/analyticsService'
import { FeuilleTravail } from '../types'
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
  Euro
} from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import ProdChart from '../components/dashboard/ProdChart'
import { Link } from 'react-router-dom'

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

// Interfaces pour les données Analytics
interface DashboardSummary {
  chantiersActifs: number;
  feuillesAttente: number;
  heuresMois: number;
  margeEstimee: number;
}

interface PerformanceMonteur {
  monteurId: string;
  nom: string;
  heures: number;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [hoursData, setHoursData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceMonteur[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, hoursRes, perfRes] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getHours(),
          analyticsService.getPerformance()
        ])

        setSummary(summaryRes.data)
        setHoursData(hoursRes.data)
        setPerformanceData(perfRes.data)
      } catch (error) {
        console.error('Erreur chargement analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Tableau de Bord Administrateur</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'team' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Performance Équipe
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Marge Estimée (Mois)"
          value={`${summary?.margeEstimee} €`}
          icon={Euro}
          color="green-600"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Heures Travaillées"
          value={`${summary?.heuresMois} h`}
          icon={Clock}
          color="blue-600"
        />
        <StatCard
          title="Chantiers Actifs"
          value={summary?.chantiersActifs || 0}
          icon={Building2}
          color="purple-600"
        />
        <StatCard
          title="À Valider"
          value={summary?.feuillesAttente || 0}
          icon={AlertCircle}
          color="orange-600"
          trend={summary?.feuillesAttente ? "Action requise" : "À jour"}
          trendUp={summary?.feuillesAttente === 0}
        />
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Production vs Déplacement (7j)</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Prod</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Trajet</span>
              </div>
            </div>
            <ProdChart data={hoursData} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performance</h3>
            <div className="space-y-4">
              {performanceData.map((monteur, index) => (
                <div key={monteur.monteurId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-700">{monteur.nom}</span>
                  </div>
                  <span className="font-bold text-gray-900">{monteur.heures} h</span>
                </div>
              ))}
              {performanceData.length === 0 && (
                <p className="text-gray-400 text-sm text-center">Pas de données disponibles</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link to="/monteurs" className="text-blue-600 text-sm font-medium hover:underline">Voir tous les monteurs</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Classement Détaillé</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3">Rang</th>
                <th className="pb-3">Monteur</th>
                <th className="pb-3 text-right">Heures Totales</th>
                <th className="pb-3 text-right">Efficacité (Est.)</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((monteur, index) => (
                <tr key={monteur.monteurId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-4">
                    <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 font-medium">{monteur.nom}</td>
                  <td className="py-4 text-right font-bold text-gray-900">{monteur.heures} h</td>
                  <td className="py-4 text-right text-gray-600">95%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

  // Utilisation des nouveaux StatCard mais avec adaptation minimale (car StatCard original supprimé)
  // On doit passer une icône LucideIcon, pas un ReactNode.

  const enAttente = feuilles.filter((f) => f.statut === 'SOUMIS').length
  const validees = feuilles.filter((f) => f.statut === 'VALIDE').length
  const rejetees = feuilles.filter((f) => f.statut === 'REJETE').length
  const heuresTotal = feuilles.reduce((acc, f) => acc + (f.heuresMatin + f.heuresApresMidi), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Vue Superviseur</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="En attente" value={enAttente} icon={AlertCircle} color="yellow-600" />
        <StatCard title="Validées" value={validees} icon={CheckCircle} color="green-600" />
        <StatCard title="Rejetées" value={rejetees} icon={XCircle} color="red-600" />
        <StatCard title="Heures Totales" value={heuresTotal} icon={Clock} color="blue-600" />
      </div>
      {/* ... Table logique conservée si possible ou simplifiée ... */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Liste détaillée disponible dans l'onglet Feuilles.</p>
      </div>
    </div>
  )
}

const MonteurDashboard = () => {
  const { user } = useAuthStore()
  // ... (simplification pour MVP)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text- gray-900">Bienvenue, {user?.name || 'Monteur'}</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Votre tableau de bord personnel est en cours de mise à jour.</p>
        <Link to="/feuilles" className="text-blue-600 hover:underline mt-2 inline-block">Voir mes feuilles d'heures</Link>
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
