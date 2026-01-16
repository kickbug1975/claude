import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env'
import { logger } from '../utils/logger'

// Configuration AWS S3
const s3 = new AWS.S3({
  accessKeyId: env.aws.accessKeyId,
  secretAccessKey: env.aws.secretAccessKey,
  region: env.aws.region,
})

// Vérifier si S3 est configuré
export const isS3Configured = (): boolean => {
  const { accessKeyId, secretAccessKey, s3Bucket } = env.aws
  const isPlaceholder = (val: string) => !val || val === 'your-access-key' || val === 'your-secret-key' || val === 'maintenance-files'

  return !!(accessKeyId && secretAccessKey && s3Bucket && !isPlaceholder(accessKeyId) && !isPlaceholder(secretAccessKey))
}

// Interface pour les métadonnées de fichier
export interface FileMetadata {
  key: string
  url: string
  originalName: string
  mimeType: string
  size: number
}

// Interface pour le fichier uploadé
interface UploadedFile {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

/**
 * Upload un fichier vers S3
 */
export const uploadToS3 = async (
  file: UploadedFile,
  folder: string = 'uploads'
): Promise<FileMetadata> => {
  const ext = path.extname(file.originalname).toLowerCase()
  const key = `${folder}/${uuidv4()}${ext}`

  const params: AWS.S3.PutObjectRequest = {
    Bucket: env.aws.s3Bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private', // Fichiers privés par défaut
  }

  try {
    await s3.upload(params).promise()

    const url = `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com/${key}`

    logger.info(`Fichier uploadé vers S3: ${key}`)

    return {
      key,
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    }
  } catch (error) {
    logger.error('Erreur upload S3:', error)
    throw error
  }
}

/**
 * Upload plusieurs fichiers vers S3
 */
export const uploadMultipleToS3 = async (
  files: UploadedFile[],
  folder: string = 'uploads'
): Promise<FileMetadata[]> => {
  const results = await Promise.all(
    files.map((file) => uploadToS3(file, folder))
  )
  return results
}

/**
 * Supprimer un fichier de S3
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: env.aws.s3Bucket,
    Key: key,
  }

  try {
    await s3.deleteObject(params).promise()
    logger.info(`Fichier supprimé de S3: ${key}`)
  } catch (error) {
    logger.error('Erreur suppression S3:', error)
    throw error
  }
}

/**
 * Supprimer plusieurs fichiers de S3
 */
export const deleteMultipleFromS3 = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) return

  const params: AWS.S3.DeleteObjectsRequest = {
    Bucket: env.aws.s3Bucket,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  }

  try {
    await s3.deleteObjects(params).promise()
    logger.info(`${keys.length} fichiers supprimés de S3`)
  } catch (error) {
    logger.error('Erreur suppression multiple S3:', error)
    throw error
  }
}

/**
 * Générer une URL signée pour accéder à un fichier privé
 */
export const getSignedUrl = (key: string, expiresIn: number = 3600): string => {
  const params = {
    Bucket: env.aws.s3Bucket,
    Key: key,
    Expires: expiresIn, // Durée de validité en secondes (défaut: 1 heure)
  }

  return s3.getSignedUrl('getObject', params)
}

/**
 * Vérifier si un fichier existe dans S3
 */
export const fileExistsInS3 = async (key: string): Promise<boolean> => {
  try {
    await s3.headObject({ Bucket: env.aws.s3Bucket, Key: key }).promise()
    return true
  } catch {
    return false
  }
}

// =====================================================
// FALLBACK: Stockage local si S3 non configuré
// =====================================================

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

// Créer le dossier uploads s'il n'existe pas
const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

/**
 * Upload un fichier localement (fallback)
 */
export const uploadLocally = async (
  file: UploadedFile,
  folder: string = 'uploads'
): Promise<FileMetadata> => {
  ensureUploadsDir()

  const ext = path.extname(file.originalname).toLowerCase()
  const filename = `${uuidv4()}${ext}`
  const subDir = path.join(UPLOADS_DIR, folder)

  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true })
  }

  const filePath = path.join(subDir, filename)
  const key = `${folder}/${filename}`

  fs.writeFileSync(filePath, file.buffer)

  logger.info(`Fichier uploadé localement: ${key}`)

  return {
    key,
    url: `/uploads/${key}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  }
}

/**
 * Supprimer un fichier local
 */
export const deleteLocally = async (key: string): Promise<void> => {
  const filePath = path.join(UPLOADS_DIR, key)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    logger.info(`Fichier supprimé localement: ${key}`)
  }
}

// =====================================================
// Service unifié (S3 ou local selon configuration)
// =====================================================

export const storageService = {
  upload: async (file: UploadedFile, folder?: string): Promise<FileMetadata> => {
    if (isS3Configured()) {
      return uploadToS3(file, folder)
    }
    return uploadLocally(file, folder)
  },

  uploadMultiple: async (files: UploadedFile[], folder?: string): Promise<FileMetadata[]> => {
    if (isS3Configured()) {
      return uploadMultipleToS3(files, folder)
    }
    return Promise.all(files.map((file) => uploadLocally(file, folder)))
  },

  delete: async (key: string): Promise<void> => {
    if (isS3Configured()) {
      return deleteFromS3(key)
    }
    return deleteLocally(key)
  },

  getUrl: (key: string): string => {
    if (isS3Configured()) {
      return getSignedUrl(key)
    }
    return `/uploads/${key}`
  },

  isConfigured: isS3Configured,
}
