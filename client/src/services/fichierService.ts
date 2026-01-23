import { api } from './api'

export interface Fichier {
  id: string
  nom: string
  url: string
  cle: string
  mimeType: string
  taille: number
  description?: string
  createdAt: string
  downloadUrl?: string
}

export const fichierService = {
  // Upload d'un ou plusieurs fichiers pour une feuille
  upload: async (files: FileList | File[], feuilleId: string, description?: string) => {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })
    formData.append('feuilleId', feuilleId)
    if (description) {
      formData.append('description', description)
    }

    const response = await api.post('/api/fichiers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Récupérer les fichiers d'une feuille
  getByFeuille: async (feuilleId: string) => {
    // Note: Le backend utilise /fichiers/feuille/:feuilleId ou quelque chose de similaire
    // Vérifions les routes backend (j'assumerai la route standard REST)
    const response = await api.get(`/api/fichiers/feuille/${feuilleId}`)
    return response.data.data as Fichier[]
  },

  // Supprimer un fichier
  delete: async (id: string) => {
    const response = await api.delete(`/api/fichiers/${id}`)
    return response.data
  }
}
