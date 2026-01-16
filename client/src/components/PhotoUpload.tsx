import { useState, useEffect, useRef } from 'react'
import { Camera, Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { Fichier, fichierService } from '../services/fichierService'
import { useToast } from './Toast'

interface PhotoUploadProps {
    feuilleId: string
    readOnly?: boolean
}

export const PhotoUpload = ({ feuilleId, readOnly = false }: PhotoUploadProps) => {
    const [photos, setPhotos] = useState<Fichier[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [photoToDelete, setPhotoToDelete] = useState<Fichier | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { showToast } = useToast()

    const fetchPhotos = async () => {
        try {
            const data = await fichierService.getByFeuille(feuilleId)
            setPhotos(data)
        } catch (error) {
            console.error('Erreur chargement photos:', error)
            showToast('Impossible de charger les photos', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (feuilleId) {
            fetchPhotos()
        }
    }, [feuilleId])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        try {
            await fichierService.upload(e.target.files, feuilleId, 'Photo chantier')
            showToast('Photo ajoutee avec succes', 'success')
            await fetchPhotos()
        } catch (error) {
            console.error('Erreur upload:', error)
            showToast('Erreur lors de l\'upload', 'error')
        } finally {
            setUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDeleteClick = (photo: Fichier) => {
        console.log('Clic sur supprimer, photo:', photo.id)
        setPhotoToDelete(photo)
    }

    const confirmDelete = async () => {
        if (!photoToDelete) return

        console.log('Confirmation de suppression de la photo:', photoToDelete.id)
        try {
            await fichierService.delete(photoToDelete.id)
            console.log('Photo supprimée avec succès')
            showToast('Photo supprimee', 'success')
            setPhotos(photos.filter(p => p.id !== photoToDelete.id))
            setPhotoToDelete(null)
        } catch (error: any) {
            console.error('Erreur suppression:', error)
            console.error('Détails erreur:', error.response?.data)
            const errorMsg = error.response?.data?.message || 'Erreur lors de la suppression'
            showToast(errorMsg, 'error')
            setPhotoToDelete(null)
        }
    }

    const cancelDelete = () => {
        console.log('Annulation de la suppression')
        setPhotoToDelete(null)
    }

    const getFullUrl = (url?: string) => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        return `${baseUrl}${url}`
    }

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Camera size={16} />
                    Photos du chantier ({photos.length})
                </h3>
                {!readOnly && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        {uploading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Upload size={16} />
                        )}
                        Ajouter une photo
                    </button>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </div>

            {photos.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
                    <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-xs">Aucune photo pour le moment</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                            <img
                                src={getFullUrl(photo.downloadUrl || photo.url)}
                                alt={photo.nom}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur+Image'
                                }}
                            />
                            {!readOnly && (
                                <button
                                    onClick={() => handleDeleteClick(photo)}
                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700"
                                    title="Supprimer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-[10px] text-white truncate px-2">
                                {new Date(photo.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale de confirmation de suppression */}
            {photoToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-2">Confirmer la suppression</h3>
                        <p className="text-gray-600 mb-4">
                            Voulez-vous vraiment supprimer cette photo ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
