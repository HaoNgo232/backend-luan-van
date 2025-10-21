import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

export type JwtPayload = {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

/**
 * Extract and verify JWT token from Authorization header
 * @param headers Request headers object
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyJwtFromHeader(headers: Record<string, string>): JwtPayload | null {
  try {
    const authHeader = headers.authorization || headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      console.error('[Auth] JWT_SECRET_KEY not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('[Auth] Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('[Auth] Invalid token');
    } else {
      console.error('[Auth] Token verification error:', error);
    }
    return null;
  }
}

/**
 * Generate JWT token
 * @param payload Token payload
 * @param expiresIn Expiration time (e.g., '15m', '7d')
 * @returns JWT token string
 */
export function generateJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn = '15m'): string {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET_KEY not configured');
  }

  const options: SignOptions = { expiresIn: Number(expiresIn) };
  return jwt.sign(payload, secret, options);
}

/**
 * Decode JWT token without verification (use for debugging only)
 * @param token JWT token
 * @returns Decoded payload or null
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
