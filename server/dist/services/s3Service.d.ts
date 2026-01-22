export declare const isS3Configured: () => boolean;
export interface FileMetadata {
    key: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
}
interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
/**
 * Upload un fichier vers S3
 */
export declare const uploadToS3: (file: UploadedFile, folder?: string) => Promise<FileMetadata>;
/**
 * Upload plusieurs fichiers vers S3
 */
export declare const uploadMultipleToS3: (files: UploadedFile[], folder?: string) => Promise<FileMetadata[]>;
/**
 * Supprimer un fichier de S3
 */
export declare const deleteFromS3: (key: string) => Promise<void>;
/**
 * Supprimer plusieurs fichiers de S3
 */
export declare const deleteMultipleFromS3: (keys: string[]) => Promise<void>;
/**
 * Générer une URL signée pour accéder à un fichier privé
 */
export declare const getSignedUrl: (key: string, expiresIn?: number) => string;
/**
 * Vérifier si un fichier existe dans S3
 */
export declare const fileExistsInS3: (key: string) => Promise<boolean>;
/**
 * Upload un fichier localement (fallback)
 */
export declare const uploadLocally: (file: UploadedFile, folder?: string) => Promise<FileMetadata>;
/**
 * Supprimer un fichier local
 */
export declare const deleteLocally: (key: string) => Promise<void>;
export declare const storageService: {
    upload: (file: UploadedFile, folder?: string) => Promise<FileMetadata>;
    uploadMultiple: (files: UploadedFile[], folder?: string) => Promise<FileMetadata[]>;
    delete: (key: string) => Promise<void>;
    getUrl: (key: string) => string;
    isConfigured: () => boolean;
};
export {};
//# sourceMappingURL=s3Service.d.ts.map