import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../services/api'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

interface ForgotPasswordForm {
    email: string
}

export const ForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>()

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true)
        setError(null)
        try {
            await api.post('/auth/forgot-password', data)
            setIsSent(true)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Une erreur est survenue')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="text-green-600" size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Email envoyé !</h2>
                    <p className="text-gray-600 mb-8">
                        Si un compte est associé à cette adresse email, vous recevrez prochainement un lien pour réinitialiser votre mot de passe.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Retour à la connexion
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
                        <h1 className="text-3xl font-bold text-gray-900">Mot de passe oublié</h1>
                        <p className="text-gray-600 mt-2">Saisissez votre email pour réinitialiser votre mot de passe</p>
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
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    {...register('email', {
                                        required: 'Email requis',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email invalide',
                                        },
                                    })}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="votre@email.com"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
