import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    clearError()
    const success = await login(data.email, data.password)
    if (success) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
            <p className="text-gray-600 mt-2">Gestion des Feuilles de Travail</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Mot de passe requis',
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Comptes de test :</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li><strong>Admin:</strong> admin@maintenance.com / Admin123!</li>
                <li><strong>Superviseur:</strong> superviseur@maintenance.com / Superviseur123!</li>
                <li><strong>Monteur:</strong> jean.dupont@maintenance.com / Monteur123!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
