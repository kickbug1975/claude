import api from './api'
import { Chantier } from '../types'

export const chantierService = {
  getAll: async (actif?: boolean) => {
    const params = actif !== undefined ? { actif } : {}
    const response = await api.get('/chantiers', { params })
    return response.data.data as Chantier[]
  },

  getById: async (id: string) => {
    const response = await api.get(`/chantiers/${id}`)
    return response.data.data
  },

  getStats: async (id: string) => {
    const response = await api.get(`/chantiers/${id}/stats`)
    return response.data.data
  },

  create: async (data: Partial<Chantier>) => {
    const response = await api.post('/chantiers', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<Chantier>) => {
    const response = await api.put(`/chantiers/${id}`, data)
    return response.data.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/chantiers/${id}`)
    return response.data
  },
}
