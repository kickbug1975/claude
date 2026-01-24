import { useEffect, useState } from 'react'
import { userService } from '../services/userService'
import { User, Monteur } from '../types'
import { Plus, Search, Loader2, User as UserIcon, Shield, Trash2, Edit2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

interface AuthUser extends User {
    monteur?: Monteur | null
}

export const UserManagement = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<AuthUser[]>([])
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AuthUser | undefined>()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { showToast } = useToast()

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await userService.getAll()
            setUsers(data)
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error)
            showToast('Erreur lors du chargement des utilisateurs', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredUsers = users.filter((user) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower) ||
            (user.monteur && `${user.monteur.prenom} ${user.monteur.nom}`.toLowerCase().includes(searchLower))
        )
    })

    const handleDelete = async (user: AuthUser) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`)) {
            return
        }

        try {
            await userService.delete(user.id)
            showToast('Utilisateur supprimé avec succès', 'success')
            fetchData()
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error')
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700'
            case 'SUPERVISEUR': return 'bg-blue-100 text-blue-700'
            case 'MONTEUR': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h2>
                    <p className="text-sm text-gray-500">Gérez les accès et les rôles de l'application</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(undefined)
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Créer un utilisateur
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par email, rôle ou nom..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <UserIcon className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">Aucun utilisateur trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lien Monteur</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Créé le</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {user.role === 'ADMIN' ? <Shield size={18} /> : <UserIcon size={18} />}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.monteur ? (
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-900">{user.monteur.prenom} {user.monteur.nom}</p>
                                                    <p className="text-gray-500 text-xs">{user.monteur.numeroIdentification}</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Aucun lien</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    title="Modifier"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    title="Supprimer"
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
            >
                <UserForm
                    user={selectedUser}
                    onSubmit={async (data) => {
                        setIsSubmitting(true)
                        try {
                            if (selectedUser) {
                                await userService.update(selectedUser.id, data)
                                showToast('Utilisateur mis à jour', 'success')
                            } else {
                                await userService.create(data)
                                showToast('Utilisateur créé', 'success')
                            }
                            setIsModalOpen(false)
                            fetchData()
                        } catch (err) {
                            showToast('Erreur lors de la sauvegarde', 'error')
                        } finally {
                            setIsSubmitting(false)
                        }
                    }}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={isSubmitting}
                />
            </Modal>
        </div>
    )
}

// Composant Interne pour le formulaire (peut être extrait plus tard)
const UserForm = ({ user, onSubmit, onCancel, isLoading }: { user?: AuthUser, onSubmit: (data: any) => void, onCancel: () => void, isLoading: boolean }) => {
    const [monteurs, setMonteurs] = useState<Monteur[]>([])
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            email: user?.email || '',
            role: user?.role || 'MONTEUR',
            monteurId: user?.monteurId || '',
            password: '',
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            telephone: '',
            adresse: '',
            numeroIdentification: '',
            dateEmbauche: new Date().toISOString().split('T')[0],
        }
    })

    const selectedRole = watch('role')
    const isMonteurRole = selectedRole === 'MONTEUR'

    useEffect(() => {
        // Charger la liste des monteurs pour le select (seulement si mode édition)
        if (user) {
            import('../services/monteurService').then(({ monteurService }) => {
                monteurService.getAll(true).then((res: any) => {
                    setMonteurs(res.data || res)
                })
            })
        }
    }, [user])

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    {...register('email', { required: 'Email requis' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                    {...register('role', { required: 'Rôle requis' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!!user}
                >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERVISEUR">SUPERVISEUR</option>
                    <option value="MONTEUR">MONTEUR</option>
                </select>
            </div>

            {/* Show Monteur fields only when creating a new MONTEUR user */}
            {isMonteurRole && !user && (
                <>
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Informations du monteur</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input
                                    {...register('nom', { required: isMonteurRole ? 'Nom requis' : false })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <input
                                    {...register('prenom', { required: isMonteurRole ? 'Prénom requis' : false })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom.message as string}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                                <input
                                    {...register('telephone', { required: isMonteurRole ? 'Téléphone requis' : false })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'identification *</label>
                                <input
                                    {...register('numeroIdentification', { required: isMonteurRole ? 'Numéro requis' : false })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="mtr-001"
                                />
                                {errors.numeroIdentification && <p className="text-red-500 text-xs mt-1">{errors.numeroIdentification.message as string}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                            <input
                                {...register('adresse', { required: isMonteurRole ? 'Adresse requise' : false })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {errors.adresse && <p className="text-red-500 text-xs mt-1">{errors.adresse.message as string}</p>}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                            <input
                                type="date"
                                {...register('dateEmbauche')}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Show monteur linking only when editing existing user */}
            {user && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lier à un monteur (Optionnel)</label>
                    <select
                        {...register('monteurId')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Aucun --</option>
                        {monteurs.map(m => (
                            <option key={m.id} value={m.id}>{m.prenom} {m.nom} ({m.numeroIdentification})</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {user ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                </label>
                <input
                    type="password"
                    {...register('password', { required: !user ? 'Mot de passe requis' : false })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="animate-spin" size={18} />}
                    {user ? 'Enregistrer' : 'Créer'}
                </button>
            </div>
        </form>
    )
}

// Pour simplifier, j'importe useForm ici (normalement déjà installé car utilisé dans Login)
import { useForm } from 'react-hook-form'
