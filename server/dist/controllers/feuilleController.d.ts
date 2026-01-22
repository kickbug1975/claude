import { Request, Response } from 'express';
export declare const getAllFeuilles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeuilleById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const validateFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectFeuille: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addFrais: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFrais: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=feuilleController.d.ts.map