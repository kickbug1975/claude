import api from './api'

export const analyticsService = {
    getSummary: async () => {
        const response = await api.get('/api/analytics/summary')
        return response.data
    },

    getHours: async () => {
        const response = await api.get('/api/analytics/hours')
        return response.data
    },

    getPerformance: async () => {
        const response = await api.get('/api/analytics/performance')
        return response.data
    }
}
