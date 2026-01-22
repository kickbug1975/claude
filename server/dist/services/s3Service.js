"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.deleteLocally = exports.uploadLocally = exports.fileExistsInS3 = exports.getSignedUrl = exports.deleteMultipleFromS3 = exports.deleteFromS3 = exports.uploadMultipleToS3 = exports.uploadToS3 = exports.isS3Configured = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Configuration AWS S3
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: env_1.env.aws.accessKeyId,
    secretAccessKey: env_1.env.aws.secretAccessKey,
    region: env_1.env.aws.region,
});
// Vérifier si S3 est configuré
const isS3Configured = () => {
    const { accessKeyId, secretAccessKey, s3Bucket } = env_1.env.aws;
    const isPlaceholder = (val) => !val || val === 'your-access-key' || val === 'your-secret-key' || val === 'maintenance-files';
    return !!(accessKeyId && secretAccessKey && s3Bucket && !isPlaceholder(accessKeyId) && !isPlaceholder(secretAccessKey));
};
exports.isS3Configured = isS3Configured;
/**
 * Upload un fichier vers S3
 */
const uploadToS3 = async (file, folder = 'uploads') => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const key = `${folder}/${(0, uuid_1.v4)()}${ext}`;
    const params = {
        Bucket: env_1.env.aws.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // Fichiers privés par défaut
    };
    try {
        await s3.upload(params).promise();
        const url = `https://${env_1.env.aws.s3Bucket}.s3.${env_1.env.aws.region}.amazonaws.com/${key}`;
        logger_1.logger.info(`Fichier uploadé vers S3: ${key}`);
        return {
            key,
            url,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        };
    }
    catch (error) {
        logger_1.logger.error('Erreur upload S3:', error);
        throw error;
    }
};
exports.uploadToS3 = uploadToS3;
/**
 * Upload plusieurs fichiers vers S3
 */
const uploadMultipleToS3 = async (files, folder = 'uploads') => {
    const results = await Promise.all(files.map((file) => (0, exports.uploadToS3)(file, folder)));
    return results;
};
exports.uploadMultipleToS3 = uploadMultipleToS3;
/**
 * Supprimer un fichier de S3
 */
const deleteFromS3 = async (key) => {
    const params = {
        Bucket: env_1.env.aws.s3Bucket,
        Key: key,
    };
    try {
        await s3.deleteObject(params).promise();
        logger_1.logger.info(`Fichier supprimé de S3: ${key}`);
    }
    catch (error) {
        logger_1.logger.error('Erreur suppression S3:', error);
        throw error;
    }
};
exports.deleteFromS3 = deleteFromS3;
/**
 * Supprimer plusieurs fichiers de S3
 */
const deleteMultipleFromS3 = async (keys) => {
    if (keys.length === 0)
        return;
    const params = {
        Bucket: env_1.env.aws.s3Bucket,
        Delete: {
            Objects: keys.map((key) => ({ Key: key })),
        },
    };
    try {
        await s3.deleteObjects(params).promise();
        logger_1.logger.info(`${keys.length} fichiers supprimés de S3`);
    }
    catch (error) {
        logger_1.logger.error('Erreur suppression multiple S3:', error);
        throw error;
    }
};
exports.deleteMultipleFromS3 = deleteMultipleFromS3;
/**
 * Générer une URL signée pour accéder à un fichier privé
 */
const getSignedUrl = (key, expiresIn = 3600) => {
    const params = {
        Bucket: env_1.env.aws.s3Bucket,
        Key: key,
        Expires: expiresIn, // Durée de validité en secondes (défaut: 1 heure)
    };
    return s3.getSignedUrl('getObject', params);
};
exports.getSignedUrl = getSignedUrl;
/**
 * Vérifier si un fichier existe dans S3
 */
const fileExistsInS3 = async (key) => {
    try {
        await s3.headObject({ Bucket: env_1.env.aws.s3Bucket, Key: key }).promise();
        return true;
    }
    catch {
        return false;
    }
};
exports.fileExistsInS3 = fileExistsInS3;
// =====================================================
// FALLBACK: Stockage local si S3 non configuré
// =====================================================
const UPLOADS_DIR = path_1.default.join(process.cwd(), 'uploads');
// Créer le dossier uploads s'il n'existe pas
const ensureUploadsDir = () => {
    if (!fs_1.default.existsSync(UPLOADS_DIR)) {
        fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
};
/**
 * Upload un fichier localement (fallback)
 */
const uploadLocally = async (file, folder = 'uploads') => {
    ensureUploadsDir();
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const filename = `${(0, uuid_1.v4)()}${ext}`;
    const subDir = path_1.default.join(UPLOADS_DIR, folder);
    if (!fs_1.default.existsSync(subDir)) {
        fs_1.default.mkdirSync(subDir, { recursive: true });
    }
    const filePath = path_1.default.join(subDir, filename);
    const key = `${folder}/${filename}`;
    fs_1.default.writeFileSync(filePath, file.buffer);
    logger_1.logger.info(`Fichier uploadé localement: ${key}`);
    return {
        key,
        url: `/uploads/${key}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
    };
};
exports.uploadLocally = uploadLocally;
/**
 * Supprimer un fichier local
 */
const deleteLocally = async (key) => {
    const filePath = path_1.default.join(UPLOADS_DIR, key);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
        logger_1.logger.info(`Fichier supprimé localement: ${key}`);
    }
};
exports.deleteLocally = deleteLocally;
// =====================================================
// Service unifié (S3 ou local selon configuration)
// =====================================================
exports.storageService = {
    upload: async (file, folder) => {
        if ((0, exports.isS3Configured)()) {
            return (0, exports.uploadToS3)(file, folder);
        }
        return (0, exports.uploadLocally)(file, folder);
    },
    uploadMultiple: async (files, folder) => {
        if ((0, exports.isS3Configured)()) {
            return (0, exports.uploadMultipleToS3)(files, folder);
        }
        return Promise.all(files.map((file) => (0, exports.uploadLocally)(file, folder)));
    },
    delete: async (key) => {
        if ((0, exports.isS3Configured)()) {
            return (0, exports.deleteFromS3)(key);
        }
        return (0, exports.deleteLocally)(key);
    },
    getUrl: (key) => {
        if ((0, exports.isS3Configured)()) {
            return (0, exports.getSignedUrl)(key);
        }
        return `/uploads/${key}`;
    },
    isConfigured: exports.isS3Configured,
};
//# sourceMappingURL=s3Service.js.map