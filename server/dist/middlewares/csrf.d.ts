import { Request, Response, NextFunction } from 'express';
/**
 * Middleware pour générer et envoyer le token CSRF au client
 */
export declare const generateCsrfToken: (req: Request, res: Response, _next: NextFunction) => void;
/**
 * Middleware de protection CSRF
 * À appliquer sur les routes nécessitant une protection
 */
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Middleware d'erreur CSRF personnalisé
 */
export declare const csrfErrorHandler: (err: any, _req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=csrf.d.ts.map