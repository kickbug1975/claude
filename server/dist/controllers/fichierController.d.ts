import { Request, Response } from 'express';
/**
 * Upload un ou plusieurs fichiers
 */
export declare const uploadFiles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Récupérer les fichiers d'une feuille de travail
 */
export declare const getFilesByFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Récupérer un fichier par son ID
 */
export declare const getFileById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Supprimer un fichier
 */
export declare const deleteFile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Attacher un fichier existant à une feuille de travail
 */
export declare const attachFileToFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Obtenir les informations de configuration du stockage
 */
export declare const getStorageInfo: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=fichierController.d.ts.map