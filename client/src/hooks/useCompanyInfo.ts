import { useState, useEffect } from 'react'
import { setupService } from '../services/setupService'

interface CompanyInfo {
    id: string
    name: string
    siret?: string
    address?: string
    email?: string
    phone?: string
    companyLogoUrl?: string
    loginLogoUrl?: string
    isSetupComplete: boolean
}

export const useCompanyInfo = () => {
    const [company, setCompany] = useState<CompanyInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await setupService.getStatus()
                setCompany(response.data.company)
                setError(null)
            } catch (err) {
                console.error('Erreur chargement company:', err)
                setError('Impossible de charger les informations de l\'entreprise')
            } finally {
                setLoading(false)
            }
        }

        fetchCompany()
    }, [])

    const getLogoUrl = (logoPath?: string) => {
        if (!logoPath) return null
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        return `${baseUrl}${logoPath}`
    }

    return {
        company,
        loading,
        error,
        companyLogoUrl: getLogoUrl(company?.companyLogoUrl),
        loginLogoUrl: getLogoUrl(company?.loginLogoUrl),
    }
}
