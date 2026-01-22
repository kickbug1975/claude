import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../services/api'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ResetPasswordForm {
    password: string
    confirmPassword: string
}

export const ResetPassword = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordForm>()

    useEffect(() => {
        if (!token) {
            setError('Token de réinitialisation manquant')
        }
    }, [token])

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) return

        setIsLoading(true)
        setError(null)
        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password,
            })
            setIsSuccess(true)
            // Rediriger après 3 secondes
            setTimeout(() => navigate('/login'), 3000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Une erreur est survenue')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="text-green-600" size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Mot de passe réinitialisé !</h2>
                    <p className="text-gray-600 mb-8">
                        Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
                    </p>
                    <Link
                        to="/login"
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Se connecter maintenant
                    </Link>
                </div>
            </div>
        )
    }

    if (error && !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-100 p-3 rounded-full">
                            <AlertCircle className="text-red-600" size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h2>
                    <p className="text-gray-600 mb-8">
                        Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Nouveau mot de passe</h1>
                        <p className="text-gray-600 mt-2">Choisissez votre nouveau mot de passe sécurisé</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'Mot de passe requis',
                                        minLength: {
                                            value: 8,
                                            message: 'Au moins 8 caractères requis',
                                        },
                                    })}
                                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="********"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-404" size={20} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('confirmPassword', {
                                        required: 'Confirmation requise',
                                        validate: (val: string) => {
                                            if (watch('password') !== val) {
                                                return 'Les mots de passe ne correspondent pas'
                                            }
                                        },
                                    })}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="********"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!error}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Réinitialisation...
                                </>
                            ) : (
                                'Enregistrer le nouveau mot de passe'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
