import api from './api'
import { Monteur, PaginatedResponse } from '../types'

export const monteurService = {
  getAll: async (actif?: boolean, page?: number, limit?: number) => {
    const params: any = {}
    if (actif !== undefined) params.actif = actif
    if (page !== undefined) params.page = page
    if (limit !== undefined) params.limit = limit

    const response = await api.get('/monteurs', { params })

    // Support nouveau format paginé
    if (response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      } as PaginatedResponse<Monteur>
    }

    // Fallback ancien format pour compatibilité
    return response.data.data as Monteur[]
  },

  getById: async (id: string) => {
    const response = await api.get(`/monteurs/${id}`)
    return response.data.data
  },

  getStats: async (id: string, mois?: number, annee?: number) => {
    const params: any = {}
    if (mois) params.mois = mois
    if (annee) params.annee = annee
    const response = await api.get(`/monteurs/${id}/stats`, { params })
    return response.data.data
  },

  create: async (data: Partial<Monteur>) => {
    const response = await api.post('/monteurs', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<Monteur>) => {
    const response = await api.put(`/monteurs/${id}`, data)
    return response.data.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/monteurs/${id}`)
    return response.data
  },
}
