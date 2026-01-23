import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extension d'interface Express Request pour inclure l'utilisateur
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string | number; // Support both (migrated vs legacy)
                email: string;
                role: string;
            };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Token manquant ou invalide',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré',
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Accès non autorisé pour ce rôle',
            });
            return;
        }

        next();
    };
};
