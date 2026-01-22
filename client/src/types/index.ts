// Types globaux de l'application

export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'SUPERVISEUR' | 'MONTEUR'
  monteurId?: string
  createdAt: string
  updatedAt: string
}

export interface Monteur {
  id: string
  nom: string
  prenom: string
  telephone: string
  email: string
  adresse: string
  dateEmbauche: string
  numeroIdentification: string
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface Chantier {
  id: string
  nom: string
  adresse: string
  client: string
  reference: string
  dateDebut: string
  dateFin?: string
  description: string
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface FeuilleTravail {
  id: string
  monteurId: string
  chantierId: string
  dateTravail: string
  dateSaisie: string
  heureDebut: string
  heureFin: string
  heuresTotales: number
  descriptionTravail: string
  statut: 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE'
  validePar?: string
  createdAt: string
  updatedAt: string
  monteur?: Monteur
  chantier?: Chantier
  frais?: Frais[]
  fichiers?: Fichier[]
  syncStatus?: 'synced' | 'pending' | 'error'
}

export interface Frais {
  id: string
  feuilleId: string
  typeFrais: 'TRANSPORT' | 'MATERIEL' | 'REPAS' | 'AUTRES'
  montant: number
  description: string
  fichierProuve?: string
  createdAt: string
}

export interface Fichier {
  id: string
  feuilleId?: string
  nom: string
  cle: string
  url: string
  mimeType: string
  taille: number
  description?: string
  downloadUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
