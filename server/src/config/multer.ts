import multer from 'multer'
import path from 'path'
import { AppError } from '../middlewares/errorHandler'

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Extensions autorisées
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx']

// Taille maximum: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Filtre pour valider les fichiers
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new AppError(`Type de fichier non autorisé: ${file.mimetype}`, 400))
    return
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new AppError(`Extension de fichier non autorisée: ${ext}`, 400))
    return
  }

  cb(null, true)
}

// Configuration multer avec stockage en mémoire (pour S3)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 fichiers par requête
  },
  fileFilter,
})

// Configuration pour stockage local (fallback si S3 non configuré)
export const uploadLocal = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = path.extname(file.originalname)
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
})

export { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE }
