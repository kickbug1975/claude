import api from './api'
import { User, Monteur } from '../types'

export interface AuthUser extends User {
    monteur?: Monteur | null
}

export const userService = {
    getAll: async () => {
        const response = await api.get('/users')
        return response.data.data
    },

    getById: async (id: string) => {
        const response = await api.get(`/users/${id}`)
        return response.data.data
    },

    create: async (data: any) => {
        const response = await api.post('/users', data)
        return response.data.data
    },

    update: async (id: string, data: any) => {
        const response = await api.patch(`/users/${id}`, data)
        return response.data.data
    },

    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`)
        return response.data.data
    },
}
