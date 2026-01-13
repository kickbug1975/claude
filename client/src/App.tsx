import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { fetchCsrfToken } from './services/api'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Feuilles } from './pages/Feuilles'
import { Monteurs } from './pages/Monteurs'
import { Chantiers } from './pages/Chantiers'
import { Unauthorized } from './pages/Unauthorized'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Initialiser le token CSRF au démarrage
    fetchCsrfToken().catch((error) => {
      console.error('Erreur lors de l\'initialisation du token CSRF:', error)
    })

    checkAuth()
  }, [checkAuth])

  return (
    <ToastProvider>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="feuilles" element={<Feuilles />} />
          <Route
            path="monteurs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISEUR']}>
                <Monteurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="chantiers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISEUR']}>
                <Chantiers />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  )
}

export default App
