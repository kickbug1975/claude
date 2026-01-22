import { Request, Response } from 'express';
/**
 * Liste tous les utilisateurs
 */
export declare const getAllUsers: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Récupère un utilisateur par son ID
 */
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Crée un nouvel utilisateur
 */
export declare const createUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Met à jour un utilisateur
 */
export declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Supprime un utilisateur
 */
export declare const deleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=userController.d.ts.map