import { Request, Response } from 'express';
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const me: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Rafraîchit le token JWT en utilisant un refresh token valide
 */
export declare const refresh: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Déconnecte l'utilisateur en révoquant son refresh token
 */
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Révoque tous les refresh tokens de l'utilisateur (déconnexion de tous les appareils)
 */
export declare const logoutAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Demande de réinitialisation de mot de passe
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Réinitialisation du mot de passe avec le token
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Changement de mot de passe (utilisateur connecté)
 */
export declare const changePassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map