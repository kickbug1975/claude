import { Request, Response } from 'express';
export declare const getSetupStatus: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createInitialAdmin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCompanyInfo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadLogos: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const finalizeSetup: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=setupController.d.ts.map