import api from './api'
import { FeuilleTravail, Frais, PaginatedResponse } from '../types'

interface FeuilleFilters {
  statut?: string
  monteurId?: string
  chantierId?: string
  dateDebut?: string
  dateFin?: string
  page?: number
  limit?: number
}

export const feuilleService = {
  getAll: async (filters?: FeuilleFilters) => {
    const response = await api.get('/feuilles', { params: filters })

    // Support nouveau format paginé
    if (response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      } as PaginatedResponse<FeuilleTravail>
    }

    // Fallback ancien format pour compatibilité
    return response.data.data as FeuilleTravail[]
  },

  getById: async (id: string) => {
    const response = await api.get(`/feuilles/${id}`)
    return response.data.data as FeuilleTravail
  },

  create: async (data: Partial<FeuilleTravail> & { frais?: Partial<Frais>[] }) => {
    const response = await api.post('/feuilles', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<FeuilleTravail>) => {
    const response = await api.put(`/feuilles/${id}`, data)
    return response.data.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/feuilles/${id}`)
    return response.data
  },

  submit: async (id: string) => {
    const response = await api.post(`/feuilles/${id}/submit`)
    return response.data.data
  },

  validate: async (id: string) => {
    const response = await api.post(`/feuilles/${id}/validate`)
    return response.data.data
  },

  reject: async (id: string) => {
    const response = await api.post(`/feuilles/${id}/reject`)
    return response.data.data
  },

  addFrais: async (feuilleId: string, frais: Partial<Frais>) => {
    const response = await api.post(`/feuilles/${feuilleId}/frais`, frais)
    return response.data.data
  },

  deleteFrais: async (feuilleId: string, fraisId: string) => {
    const response = await api.delete(`/feuilles/${feuilleId}/frais/${fraisId}`)
    return response.data
  },
}
