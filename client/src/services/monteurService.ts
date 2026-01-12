import api from './api'
import { Monteur } from '../types'

export const monteurService = {
  getAll: async (actif?: boolean) => {
    const params = actif !== undefined ? { actif } : {}
    const response = await api.get('/monteurs', { params })
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
