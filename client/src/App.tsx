import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Feuilles } from './pages/Feuilles'
import { Monteurs } from './pages/Monteurs'
import { Chantiers } from './pages/Chantiers'
import { Unauthorized } from './pages/Unauthorized'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
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
  )
}

export default App
