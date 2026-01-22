import { Request, Response } from 'express';
/**
 * Lister tous les jobs cron
 */
export declare const getAllJobs: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Activer/Désactiver un job
 */
export declare const toggleJobStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Exécuter un job manuellement
 */
export declare const executeJob: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cronController.d.ts.map