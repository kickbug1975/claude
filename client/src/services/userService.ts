import api from './api'
import { User, Monteur } from '../types'

export interface AuthUser extends User {
    monteur?: Monteur | null
}

export const userService = {
    getAll: async () => {
        const response = await api.get('/api/users')
        return response.data.data
    },

    getById: async (id: string) => {
        const response = await api.get(`/api/users/${id}`)
        return response.data.data
    },

    create: async (data: any) => {
        const response = await api.post('/api/users', data)
        return response.data.data
    },

    update: async (id: string, data: any) => {
        const response = await api.patch(`/api/users/${id}`, data)
        return response.data.data
    },

    delete: async (id: string) => {
        const response = await api.delete(`/api/users/${id}`)
        return response.data.data
    },
}
