import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

export const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <ShieldX className="mx-auto text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acces non autorise</h1>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas les permissions necessaires pour acceder a cette page.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
