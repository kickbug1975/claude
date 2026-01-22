import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
    Building2,
    Image as ImageIcon,
    Upload,
    Loader2,
    X,
    UserPlus,
    Briefcase,
    Save
} from 'lucide-react'
import { setupService } from '../services/setupService'
import { useToast } from '../components/Toast'
import Papa from 'papaparse'

interface CompanyFormData {
    name: string
    siret?: string
    address?: string
    email?: string
    phone?: string
}

export const Settings = () => {
    const [loading, setLoading] = useState(false)
    const [existingCounts, setExistingCounts] = useState({ monteurs: 0, chantiers: 0 })
    const [companyLogo, setCompanyLogo] = useState<File | null>(null)
    const [loginLogo, setLoginLogo] = useState<File | null>(null)
    const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('')
    const [loginLogoUrl, setLoginLogoUrl] = useState<string>('')
    const [monteursData, setMonteursData] = useState<any[]>([])
    const [chantiersData, setChantiersData] = useState<any[]>([])

    const { showToast } = useToast()
    const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>()

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            try {
                const response = await setupService.getStatus()
                setExistingCounts(response.data.counts || { monteurs: 0, chantiers: 0 })
                if (response.data.company) {
                    reset({
                        name: response.data.company.name,
                        siret: response.data.company.siret || '',
                        address: response.data.company.address || '',
                        email: response.data.company.email || '',
                        phone: response.data.company.phone || '',
                    })
                    setCompanyLogoUrl(response.data.company.companyLogoUrl || '')
                    setLoginLogoUrl(response.data.company.loginLogoUrl || '')
                }
            } catch (error) {
                showToast('Erreur lors du chargement des paramètres', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [reset, showToast])

    const handleCompanySubmit = async (data: CompanyFormData) => {
        setLoading(true)
        try {
            await setupService.updateCompany(data)
            showToast('Informations de l\'entreprise mises à jour', 'success')
        } catch (error) {
            showToast('Erreur lors de la mise à jour', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = async () => {
        if (!companyLogo && !loginLogo) return
        setLoading(true)
        try {
            await setupService.uploadLogos(companyLogo || undefined, loginLogo || undefined)
            showToast('Logos mis à jour avec succès', 'success')
            // Refresh urls
            const response = await setupService.getStatus()
            setCompanyLogoUrl(response.data.company.companyLogoUrl || '')
            setLoginLogoUrl(response.data.company.loginLogoUrl || '')
            setCompanyLogo(null)
            setLoginLogo(null)
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
        if (monteursData.length === 0 && chantiersData.length === 0) return
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
        } catch (error) {
            showToast('Erreur lors de l\'importation', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !companyLogoUrl) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Identité de l'Entreprise</h2>
                        <p className="text-sm text-slate-500">Gérez les informations légales et de contact.</p>
                    </div>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit(handleCompanySubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Nom commercial *</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">SIRET</label>
                                <input
                                    {...register('siret')}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Email de contact</label>
                                <input
                                    {...register('email')}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                                <input
                                    {...register('phone')}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Adresse complète</label>
                                <textarea
                                    {...register('address')}
                                    rows={2}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50 transition-all outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Enregistrer les modifications
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Branding & Logos</h2>
                        <p className="text-sm text-slate-500">Personnalisez l'apparence visuelle.</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-sm font-semibold text-slate-700">Logo de l'application</p>
                            <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden">
                                {companyLogo ? (
                                    <img src={URL.createObjectURL(companyLogo)} className="max-h-full" alt="New logo" />
                                ) : companyLogoUrl ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${companyLogoUrl}`} className="max-h-full" alt="Current logo" />
                                ) : (
                                    <ImageIcon className="text-slate-300" size={48} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setCompanyLogo(e.target.files[0])}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm font-semibold text-slate-700">Logo de connexion</p>
                            <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden">
                                {loginLogo ? (
                                    <img src={URL.createObjectURL(loginLogo)} className="max-h-full" alt="New logo" />
                                ) : loginLogoUrl ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${loginLogoUrl}`} className="max-h-full" alt="Current logo" />
                                ) : (
                                    <ImageIcon className="text-slate-300" size={48} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setLoginLogo(e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>
                    {(companyLogo || loginLogo) && (
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleLogoUpload}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading && <Loader2 className="animate-spin" size={20} />}
                                Mettre à jour les logos
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Importation Additionnelle</h2>
                        <p className="text-sm text-slate-500">Ajoutez des monteurs ou des chantiers en masse via CSV.</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-6 rounded-2xl border-2 transition-all ${monteursData.length > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <UserPlus size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Monteurs</h3>
                                </div>
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                                    {existingCounts.monteurs} au total
                                </span>
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
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                                    {existingCounts.chantiers} au total
                                </span>
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
                    {(monteursData.length > 0 || chantiersData.length > 0) && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleImportSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading && <Loader2 className="animate-spin" size={20} />}
                                Lancer l'importation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
