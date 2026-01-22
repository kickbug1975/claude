import { Request, Response } from 'express';
export declare const getAllChantiers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getChantierById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createChantier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateChantier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteChantier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getChantierStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chantierController.d.ts.map