import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
    Building2,
    Image as ImageIcon,
    Upload,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Loader2,
    X,
    UserPlus,
    Briefcase,
    LogIn,
    LogOut,
    Lock
} from 'lucide-react'
import { setupService } from '../services/setupService'
import { useToast } from '../components/Toast'
import Papa from 'papaparse'
import { useAuthStore } from '../store/authStore'

interface CompanyFormData {
    name: string
    siret?: string
    address?: string
    email?: string
    phone?: string
}

export const Wizard = () => {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasAdmin, setHasAdmin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [, setCompanyInfo] = useState<CompanyFormData>({ name: '', siret: '', address: '', email: '', phone: '' })
    const [companyLogo, setCompanyLogo] = useState<File | null>(null)
    const [loginLogo, setLoginLogo] = useState<File | null>(null)
    const [monteursData, setMonteursData] = useState<any[]>([])
    const [chantiersData, setChantiersData] = useState<any[]>([])
    const [existingCounts, setExistingCounts] = useState({ monteurs: 0, chantiers: 0 })
    const [isFinalizing, setIsFinalizing] = useState(false)

    const navigate = useNavigate()
    const { showToast } = useToast()
    const { login, isAuthenticated, logout, checkSetup } = useAuthStore()
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CompanyFormData>()

    const steps = [
        { id: 1, name: 'Authentification', icon: Lock },
        { id: 2, name: 'Identité', icon: Building2 },
        { id: 3, name: 'Branding', icon: ImageIcon },
        { id: 4, name: 'Import', icon: Upload },
        { id: 5, name: 'Terminer', icon: CheckCircle2 },
    ]

    useEffect(() => {
        const fetchSetupStatus = async () => {
            setLoading(true)
            try {
                console.log('Fetching setup status...')
                const response = await setupService.getStatus()

                if (!response || !response.success) {
                    console.error('Setup status response unsuccessful:', response)
                    throw new Error(response?.message || 'Erreur lors de la récupération du statut')
                }

                console.log('Setup status data:', response.data)
                setExistingCounts(response.data.counts || { monteurs: 0, chantiers: 0 })
                setHasAdmin(response.data.hasAdmin)

                if (response.data.isSetupComplete) {
                    navigate('/dashboard')
                } else {
                    if (isAuthenticated && step === 1) {
                        setStep(2)
                        if (response.data.company) {
                            setCompanyInfo(response.data.company)
                            setValue('name', response.data.company.name || '')
                            setValue('siret', response.data.company.siret || '')
                            setValue('address', response.data.company.address || '')
                            setValue('email', response.data.company.email || '')
                            setValue('phone', response.data.company.phone || '')
                        }
                    } else if (!isAuthenticated) {
                        setStep(1)
                    }
                }
            } catch (error: any) {
                console.error('Erreur fetchSetupStatus detail:', error)
                const errorMsg = error.response?.data?.message || error.message || 'Erreur de connexion au serveur'
                showToast(`Erreur configuration: ${errorMsg}`, 'error')
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated || step === 1) {
            fetchSetupStatus()
        }
    }, [navigate, showToast, isAuthenticated, step, setValue])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!hasAdmin) {
                console.log('Creating initial admin...')
                await setupService.createAdmin({ email, password })
                showToast('Administrateur créé, connexion en cours...', 'info')

                const loginSuccess = await login(email, password)
                if (loginSuccess) {
                    showToast('Initialisation réussie', 'success')
                    setStep(2)
                }
            } else {
                const success = await login(email, password)
                if (success) {
                    showToast('Connexion réussie', 'success')
                    setStep(2)
                } else {
                    showToast('Identifiants invalides', 'error')
                }
            }
        } catch (error: any) {
            console.error('Login/Creation error:', error)
            showToast(error.response?.data?.message || 'Une erreur est survenue lors de l\'authentification', 'error')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(prev => Math.min(prev + 1, steps.length))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const handleCompanySubmit = async (data: CompanyFormData) => {
        setLoading(true)
        try {
            await setupService.updateCompany(data)
            setCompanyInfo(data) // Update local state with submitted data
            showToast('Informations enregistrées', 'success')
            nextStep()
        } catch (error) {
            showToast('Erreur lors de l\'enregistrement', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleBrandingSubmit = async () => {
        if (!companyLogo && !loginLogo) {
            nextStep()
            return
        }
        setLoading(true)
        try {
            await setupService.uploadLogos(companyLogo || undefined, loginLogo || undefined)
            showToast('Logos mis à jour', 'success')
            nextStep()
        } catch (error) {
            showToast('Erreur lors de l\'upload des logos', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleFileImport = (type: 'monteurs' | 'chantiers', file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (type === 'monteurs') {
                    setMonteursData(results.data)
                } else {
                    setChantiersData(results.data)
                }
                showToast(`${results.data.length} ${type} détectés`, 'info')
            },
            error: () => {
                showToast('Erreur de lecture du fichier CSV', 'error')
            }
        })
    }

    const handleImportSubmit = async () => {
        if (monteursData.length === 0 && chantiersData.length === 0) {
            nextStep()
            return
        }
        setLoading(true)
        try {
            const response = await setupService.importData({
                monteurs: monteursData,
                chantiers: chantiersData
            })
            const { importedMonteurs, importedChantiers } = response.data
            showToast(`${importedMonteurs} monteurs et ${importedChantiers} chantiers importés`, 'success')

            // Refresh counts
            const statusRes = await setupService.getStatus()
            setExistingCounts(statusRes.data.counts)

            setMonteursData([])
            setChantiersData([])
            nextStep()
        } catch (error) {
            showToast('Erreur lors de l\'importation', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        setStep(1)
        setEmail('')
        setPassword('')
        showToast('Déconnexion réussie', 'info')
    }

    const handleFinalize = async () => {
        setIsFinalizing(true)
        try {
            await setupService.finalize()
            showToast('Configuration terminée avec succès !', 'success')

            // Mettre à jour le statut de setup dans le store
            await checkSetup()

            navigate('/dashboard')
        } catch (error) {
            showToast('Erreur lors de la finalisation', 'error')
        } finally {
            setIsFinalizing(false)
            setLoading(false)
        }
    }

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8">
            {steps.map((s, index) => (
                <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                            {step > s.id ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
                        </div>
                        <span className={`text-xs mt-2 font-medium text-center ${step >= s.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {s.name}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`h-1 flex-1 mx-2 -mt-6 transition-all duration-500 ${step > s.id ? 'bg-indigo-600' : 'bg-gray-100'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Decor */}
                <div className="w-full md:w-1/3 bg-indigo-700 p-8 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <Building2 className="text-indigo-700" size={20} />
                            </div>
                            <span className="font-bold text-xl tracking-tight">Setup Wizard</span>
                        </div>
                        <h1 className="text-3xl font-extrabold leading-tight mb-4">Initialisez votre plateforme</h1>
                        <p className="text-indigo-100/80 text-sm leading-relaxed">
                            Configurez l'identité visuelle et importez vos données pour démarrer rapidement la gestion de vos feuilles de travail.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="hidden md:block">
                            <div className="space-y-4 opacity-50">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={16} /> <span className="text-xs uppercase tracking-wider font-semibold">100% Sécurisé</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={16} /> <span className="text-xs uppercase tracking-wider font-semibold">Données Isolées</span>
                                </div>
                            </div>
                        </div>
                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all"
                            >
                                <LogOut size={16} /> Déconnexion
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12">
                    {renderStepIndicator()}

                    <div className="mt-8">
                        {step === 1 && (
                            <div className="max-w-md mx-auto space-y-8 py-8">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Lock size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {!hasAdmin ? 'Initialisation Globale' : 'Accès Administrateur'}
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        {!hasAdmin
                                            ? 'Créez le compte administrateur principal pour démarrer.'
                                            : 'Veuillez vous connecter pour configurer votre instance.'}
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@example.com"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                                        {!hasAdmin ? 'Créer mon compte et continuer' : 'Se connecter et continuer'}
                                    </button>
                                </form>

                                {hasAdmin && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-xs text-amber-800">
                                            Identifiants par défaut : <strong>admin@maintenance.com</strong> / <strong>Admin123!</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit(handleCompanySubmit)} className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Identité de l'Entreprise</h2>
                                    <p className="text-slate-500 text-sm">Ces informations apparaîtront sur les exports PDF et factures.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Nom commercial *</label>
                                        <input
                                            {...register('name', { required: 'Le nom est requis' })}
                                            className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'} bg-slate-50 transition-all outline-none`}
                                            placeholder="Maintenance Express"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">SIRET</label>
                                        <input
                                            {...register('siret')}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                            placeholder="123 456 789 00010"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Email de contact</label>
                                        <input
                                            {...register('email')}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                            placeholder="contact@entreprise.com"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                                        <input
                                            {...register('phone')}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                            placeholder="01 23 45 67 89"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Adresse complète</label>
                                        <textarea
                                            {...register('address')}
                                            rows={2}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none resize-none"
                                            placeholder="123 Rue de la Maintenance, 75000 Paris"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continuer'}
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Branding & Logos</h2>
                                    <p className="text-slate-500 text-sm">Personnalisez l'apparence de votre plateforme.</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="flex-1 space-y-3">
                                            <p className="text-sm font-semibold text-slate-700">Logo de l'application</p>
                                            <div className="relative group">
                                                <div className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${companyLogo ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                                                    }`}>
                                                    {companyLogo ? (
                                                        <div className="relative w-full h-full p-4 flex items-center justify-center">
                                                            <img src={URL.createObjectURL(companyLogo)} className="max-h-full rounded-lg" alt="Preview" />
                                                            <button onClick={() => setCompanyLogo(null)} className="absolute top-2 right-2 p-1 bg-white shadow-md rounded-full text-slate-400 hover:text-red-500"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="text-slate-300 mb-2" size={40} />
                                                            <p className="text-xs text-slate-400">Glissez-déposez ou cliquez</p>
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => e.target.files && setCompanyLogo(e.target.files[0])}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Utilisé pour la barre latérale et les documents.</p>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <p className="text-sm font-semibold text-slate-700">Logo de connexion</p>
                                            <div className="relative group">
                                                <div className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${loginLogo ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                                                    }`}>
                                                    {loginLogo ? (
                                                        <div className="relative w-full h-full p-4 flex items-center justify-center">
                                                            <img src={URL.createObjectURL(loginLogo)} className="max-h-full rounded-lg" alt="Preview" />
                                                            <button onClick={() => setLoginLogo(null)} className="absolute top-2 right-2 p-1 bg-white shadow-md rounded-full text-slate-400 hover:text-red-500"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="text-slate-300 mb-2" size={40} />
                                                            <p className="text-xs text-slate-400">Glissez-déposez ou cliquez</p>
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => e.target.files && setLoginLogo(e.target.files[0])}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Affiché en grand sur la page d'accueil.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button onClick={prevStep} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-all"><ChevronLeft size={20} /> Retour</button>
                                    <button
                                        onClick={handleBrandingSubmit}
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continuer'}
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Importation de Données</h2>
                                    <p className="text-slate-500 text-sm">Gagnez du temps en important vos listes existantes (CSV).</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-6 rounded-2xl border-2 transition-all ${monteursData.length > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <UserPlus size={20} />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Monteurs</h3>
                                            </div>
                                            {existingCounts.monteurs > 0 && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                                    {existingCounts.monteurs} existants
                                                </span>
                                            )}
                                        </div>
                                        {monteursData.length > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-700">{monteursData.length} lignes prêtes</p>
                                                <button onClick={() => setMonteursData([])} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all text-slate-600 text-sm">
                                                    <Upload size={16} /> Sélectionner un CSV
                                                    <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && handleFileImport('monteurs', e.target.files[0])} />
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`p-6 rounded-2xl border-2 transition-all ${chantiersData.length > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <Briefcase size={20} />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Chantiers</h3>
                                            </div>
                                            {existingCounts.chantiers > 0 && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                                    {existingCounts.chantiers} existants
                                                </span>
                                            )}
                                        </div>
                                        {chantiersData.length > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-700">{chantiersData.length} lignes prêtes</p>
                                                <button onClick={() => setChantiersData([])} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all text-slate-600 text-sm">
                                                    <Upload size={16} /> Sélectionner un CSV
                                                    <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && handleFileImport('chantiers', e.target.files[0])} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-xs">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <p>L'importation détecte automatiquement les colonnes correspondantes. Les doublons éventuels seront ignorés lors du traitement final.</p>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button onClick={prevStep} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-all"><ChevronLeft size={20} /> Retour</button>
                                    <button
                                        onClick={handleImportSubmit}
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (monteursData.length > 0 || chantiersData.length > 0 ? 'Importer' : 'Passer cette étape')}
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6 text-center">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={48} />
                                </div>

                                <h2 className="text-3xl font-extrabold text-slate-800">C'est prêt !</h2>
                                <div className="max-w-md mx-auto space-y-4">
                                    <p className="text-slate-600 leading-relaxed">
                                        Toutes les informations nécessaires ont été collectées. En cliquant sur le bouton ci-dessous, vous finaliserez la configuration de votre plateforme.
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 space-y-4 max-w-lg mx-auto mt-8">
                                    <p className="text-xs uppercase font-bold text-slate-400 tracking-widest">Récapitulatif</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Entreprise</span>
                                        <span className="font-bold text-slate-800">{watch('name')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Logos</span>
                                        <span className="font-bold text-slate-800">{(companyLogo || loginLogo) ? 'Configurés' : 'Par défaut'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Données</span>
                                        <span className="font-bold text-slate-800">{monteursData.length} monteurs, {chantiersData.length} chantiers</span>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-8">
                                    <button
                                        onClick={handleFinalize}
                                        disabled={isFinalizing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {isFinalizing ? <Loader2 className="animate-spin" size={24} /> : 'FINALISER LA CONFIGURATION'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
