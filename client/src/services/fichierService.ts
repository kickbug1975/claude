import api from './api'
import { Fichier } from '../types'

interface UploadResponse {
  success: boolean
  message: string
  data: Fichier[]
}

interface FichierResponse {
  success: boolean
  data: Fichier | Fichier[]
}

interface StorageInfoResponse {
  success: boolean
  data: {
    storageType: 'S3' | 'local'
    configured: boolean
  }
}

/**
 * Upload de fichiers
 */
export const uploadFiles = async (
  files: File[],
  feuilleId?: string,
  description?: string
): Promise<Fichier[]> => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  if (feuilleId) {
    formData.append('feuilleId', feuilleId)
  }

  if (description) {
    formData.append('description', description)
  }

  const response = await api.post<UploadResponse>('/fichiers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.data
}

/**
 * Récupérer les fichiers d'une feuille
 */
export const getFilesByFeuille = async (feuilleId: string): Promise<Fichier[]> => {
  const response = await api.get<FichierResponse>(`/fichiers/feuille/${feuilleId}`)
  return response.data.data as Fichier[]
}

/**
 * Récupérer un fichier par ID
 */
export const getFileById = async (id: string): Promise<Fichier> => {
  const response = await api.get<FichierResponse>(`/fichiers/${id}`)
  return response.data.data as Fichier
}

/**
 * Supprimer un fichier
 */
export const deleteFile = async (id: string): Promise<void> => {
  await api.delete(`/fichiers/${id}`)
}

/**
 * Attacher un fichier à une feuille
 */
export const attachFileToFeuille = async (
  fileId: string,
  feuilleId: string
): Promise<Fichier> => {
  const response = await api.patch<FichierResponse>(`/fichiers/${fileId}/attach`, {
    feuilleId,
  })
  return response.data.data as Fichier
}

/**
 * Récupérer les informations de stockage
 */
export const getStorageInfo = async (): Promise<StorageInfoResponse['data']> => {
  const response = await api.get<StorageInfoResponse>('/fichiers/storage-info')
  return response.data.data
}

/**
 * Formater la taille d'un fichier
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Vérifier si un type MIME est une image
 */
export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

/**
 * Vérifier si un type MIME est un PDF
 */
export const isPdf = (mimeType: string): boolean => {
  return mimeType === 'application/pdf'
}

export default {
  uploadFiles,
  getFilesByFeuille,
  getFileById,
  deleteFile,
  attachFileToFeuille,
  getStorageInfo,
  formatFileSize,
  isImage,
  isPdf,
}
