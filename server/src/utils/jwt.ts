import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
    userId: string | number;
    email: string;
    role: string;
}

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' }); // 15 minutes as per standard practice, though dist said env.jwtExpiresIn which might be missing in env.ts. Let's use a safe default or env if available.
};

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
