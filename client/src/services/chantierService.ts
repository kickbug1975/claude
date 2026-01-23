import api from './api'
import { Chantier, PaginatedResponse } from '../types'

export const chantierService = {
  getAll: async (actif?: boolean, page?: number, limit?: number) => {
    const params: any = {}
    if (actif !== undefined) params.actif = actif
    if (page !== undefined) params.page = page
    if (limit !== undefined) params.limit = limit

    const response = await api.get('/api/chantiers', { params })

    // Support nouveau format paginé
    if (response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      } as PaginatedResponse<Chantier>
    }

    // Fallback ancien format pour compatibilité
    return response.data.data as Chantier[]
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/chantiers/${id}`)
    return response.data.data
  },

  getStats: async (id: string) => {
    const response = await api.get(`/api/chantiers/${id}/stats`)
    return response.data.data
  },

  create: async (data: Partial<Chantier>) => {
    const response = await api.post('/api/chantiers', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<Chantier>) => {
    const response = await api.put(`/api/chantiers/${id}`, data)
    return response.data.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/chantiers/${id}`)
    return response.data
  },
}
