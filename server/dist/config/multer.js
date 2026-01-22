"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FILE_SIZE = exports.ALLOWED_EXTENSIONS = exports.ALLOWED_MIME_TYPES = exports.uploadLocal = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("../middlewares/errorHandler");
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
];
exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
// Extensions autorisées
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
// Taille maximum: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
// Filtre pour valider les fichiers
const fileFilter = (_req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new errorHandler_1.AppError(`Type de fichier non autorisé: ${file.mimetype}`, 400));
        return;
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new errorHandler_1.AppError(`Extension de fichier non autorisée: ${ext}`, 400));
        return;
    }
    cb(null, true);
};
// Configuration multer avec stockage en mémoire (pour S3)
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5, // Maximum 5 fichiers par requête
    },
    fileFilter,
});
// Configuration pour stockage local (fallback si S3 non configuré)
exports.uploadLocal = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path_1.default.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5,
    },
    fileFilter,
});
//# sourceMappingURL=multer.js.map