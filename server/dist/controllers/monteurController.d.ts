import { Request, Response } from 'express';
export declare const getAllMonteurs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMonteurById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMonteur: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMonteur: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMonteur: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMonteurStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=monteurController.d.ts.map