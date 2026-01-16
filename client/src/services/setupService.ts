import { api } from './api'

export const setupService = {
    getStatus: async () => {
        const response = await api.get('/setup/status')
        return response.data
    },

    updateCompany: async (data: any) => {
        const response = await api.put('/setup/company', data)
        return response.data
    },

    uploadLogos: async (companyLogo?: File, loginLogo?: File) => {
        const formData = new FormData()
        if (companyLogo) formData.append('companyLogo', companyLogo)
        if (loginLogo) formData.append('loginLogo', loginLogo)

        const response = await api.post('/setup/logos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    importData: async (data: any) => {
        const response = await api.post('/setup/import', data)
        return response.data
    },

    finalize: async () => {
        const response = await api.post('/setup/finalize')
        return response.data
    },

    createAdmin: async (data: any) => {
        const response = await api.post('/setup/admin', data)
        return response.data
    },
}
