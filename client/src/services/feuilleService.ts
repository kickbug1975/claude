import api from './api'
import { db } from '../db/db'
import { syncService } from './syncService'
import { FeuilleTravail, Frais, PaginatedResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'

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
    // Si en ligne, on essaie de récupérer et mettre en cache
    if (syncService.getOnlineStatus()) {
      try {
        const response = await api.get('/feuilles', { params: filters })
        const data = response.data.pagination ? response.data.data : response.data.data

        // Mise en cache (upsert pour ne pas écraser les items locaux non synchronisés)
        // On ne supprime pas tout le cache pour garder les "pending"
        const itemsToCache = data.map((f: any) => ({ ...f, syncStatus: 'synced' }))
        await db.feuilles.bulkPut(itemsToCache)

        if (response.data.pagination) {
          return {
            data: itemsToCache,
            pagination: response.data.pagination,
          } as PaginatedResponse<FeuilleTravail>
        }
        return itemsToCache as FeuilleTravail[]
      } catch (error) {
        console.warn('API Error, falling back to cache', error)
      }
    }

    // Fallback Offline: Lecture depuis IndexedDB
    let collection = db.feuilles.toCollection()

    // Application basique des filtres (statut uniquement pour le moment en offline)
    if (filters?.statut) {
      collection = db.feuilles.where('statut').equals(filters.statut)
    }

    const all = await collection.reverse().sortBy('dateTravail') // Tri par date

    // Pagination simulée en offline
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const start = (page - 1) * limit
    const pagedData = all.slice(start, start + limit)

    return {
      data: pagedData,
      pagination: {
        page,
        pageSize: limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit)
      }
    } as PaginatedResponse<FeuilleTravail>
  },

  getById: async (id: string) => {
    if (syncService.getOnlineStatus()) {
      try {
        const response = await api.get(`/feuilles/${id}`)
        return response.data.data as FeuilleTravail
      } catch (e) {
        console.warn('Fetch error, trying cache')
      }
    }
    const cached = await db.feuilles.get(id)
    if (cached) return cached
    throw new Error('Feuille non trouvée (et pas de connexion)')
  },

  create: async (data: Partial<FeuilleTravail> & { frais?: Partial<Frais>[] }) => {
    if (syncService.getOnlineStatus()) {
      try {
        const response = await api.post('/feuilles', data)
        const newItem = { ...response.data.data, syncStatus: 'synced' }
        await db.feuilles.put(newItem)
        return newItem
      } catch (error) {
        console.warn('API Create failed, switching to offline mode')
      }
    }

    // Offline Create
    const tempId = uuidv4()
    const newItem: any = {
      ...data,
      id: tempId,
      statut: 'BROUILLON',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    await db.feuilles.add(newItem)
    await syncService.addToQueue('CREATE_FEUILLE', newItem)
    return newItem
  },

  update: async (id: string, data: Partial<FeuilleTravail>) => {
    if (syncService.getOnlineStatus()) {
      try {
        const response = await api.put(`/feuilles/${id}`, data)
        // Update local cache
        const updatedItem = { ...response.data.data, syncStatus: 'synced' }
        await db.feuilles.put(updatedItem)
        return updatedItem
      } catch (error) {
        console.warn('API Update failed, switching to offline', error)
      }
    }

    // Offline Update
    // We need to check if it's a local temp item or a server item
    const item = await db.feuilles.get(id)
    if (item) {
      const updatedItem = { ...item, ...data, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
      await db.feuilles.put(updatedItem)
      await syncService.addToQueue('UPDATE_FEUILLE', { id, data })
      return updatedItem
    }
    throw new Error('Feuille non trouvée localement pour mise à jour')
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
