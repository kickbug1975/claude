import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import { UserManagement } from './pages/UserManagement'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Unauthorized } from './pages/Unauthorized'
import { Settings } from './pages/Settings'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const [isReady, setIsReady] = useState(false)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const initialCheck = useAuthStore((state) => state.initialCheck)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const initApp = async () => {
      // Initialiser le token CSRF au démarrage
      try {
        await fetchCsrfToken()
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du token CSRF:', error)
      }

      await initialCheck()
      await checkAuth()
      setIsReady(true)
    }

    initApp()
  }, [checkAuth, initialCheck])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }



  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Root dynamic routing */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/login" replace />
                )
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
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
