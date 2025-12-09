import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600 mb-4">
              Gestion des Feuilles de Travail
            </h1>
            <p className="text-gray-600 text-lg">
              Application de maintenance - Configuration réussie ✅
            </p>
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Prochaines étapes</h2>
              <ul className="text-left text-gray-600 space-y-2">
                <li>✅ React + TypeScript configuré</li>
                <li>✅ Tailwind CSS installé</li>
                <li>✅ ESLint + Prettier configurés</li>
                <li>⏳ Configuration de la base de données</li>
                <li>⏳ Authentification JWT</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
