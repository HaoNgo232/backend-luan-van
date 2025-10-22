import { JwtService } from './jwt/jwt.service';
import * as jose from 'jose';
/**
 * Singleton JwtService instance for use in shared functions
 * Initialized by calling initJwtService() from application bootstrap
 */
let jwtServiceInstance: JwtService | null = null;

/**
 * Initialize the shared JwtService instance
 * Must be called during application bootstrap before using auth functions
 *
 * @param jwtService JwtService instance from dependency injection
 *
 * @example
 * // In main.ts or app bootstrap
 * const app = await NestFactory.create(AppModule);
 * const jwtService = app.get(JwtService);
 * initJwtService(jwtService);
 */
export function initJwtService(jwtService: JwtService): void {
  jwtServiceInstance = jwtService;
  console.log('[Auth] JwtService initialized for shared auth functions');
}

/**
 * Extract and verify JWT token from Authorization header
 * Uses JwtService for RSA-based token verification
 *
 * @param headers Request headers object
 * @returns Decoded JWT payload or null if invalid
 *
 * @example
 * const payload = await verifyJwtFromHeader(request.headers);
 * if (payload) {
 *   console.log('Authenticated user:', payload.sub);
 * }
 */
export async function verifyJwtFromHeader(
  headers: Record<string, string>,
): Promise<jose.JWTPayload | null> {
  try {
    if (!jwtServiceInstance) {
      console.error('[Auth] JwtService not initialized. Call initJwtService() first.');
      return null;
    }

    const authHeader = headers.authorization || headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    // Use JwtService to verify token with RSA public key
    const decoded = await jwtServiceInstance.verifyToken(token);
    return decoded;
  } catch (error) {
    // JwtService already logs detailed errors
    console.warn(
      '[Auth] Token verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

/**
 * Generate JWT token with RSA private key
 * Only user-app should call this (requires private key)
 *
 * @param payload Token payload (userId, email, role)
 * @param expiresIn Expiration time (e.g., '15m', '7d')
 * @returns JWT token string
 * @throws Error if JwtService not initialized or private key not available
 *
 * @example
 * const token = await generateJwt(
 *   { userId: '123', email: 'user@example.com', role: 'CUSTOMER' },
 *   '15m'
 * );
 */
export async function generateJwt(payload: jose.JWTPayload, expiresIn = '15m'): Promise<string> {
  if (!jwtServiceInstance) {
    throw new Error('[Auth] JwtService not initialized. Call initJwtService() first.');
  }

  // Parse expiration string to seconds
  const seconds = parseExpiresIn(expiresIn);

  // Use JwtService to sign token with RSA private key
  return await jwtServiceInstance.signToken(payload, seconds);
}

/**
 * Decode JWT token without verification (use for debugging only)
 * ⚠️  WARNING: Does not validate signature or expiration!
 *
 * @param token JWT token
 * @returns Decoded payload or null
 *
 * @example
 * const payload = decodeJwt(token);
 * console.log('Token user ID:', payload?.userId);
 */
export function decodeJwt(token: string): jose.JWTPayload | null {
  try {
    if (!jwtServiceInstance) {
      console.error('[Auth] JwtService not initialized');
      return null;
    }

    const { payload } = jwtServiceInstance.decodeToken(token);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Parse expiration time string to seconds
 * Supports: 's' (seconds), 'm' (minutes), 'h' (hours), 'd' (days)
 *
 * @param expiresIn Expiration string (e.g., '15m', '7d')
 * @returns Number of seconds
 *
 * @example
 * parseExpiresIn('15m') // returns 900
 * parseExpiresIn('7d')  // returns 604800
 */
function parseExpiresIn(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    console.warn(`[Auth] Invalid expiresIn format: ${expiresIn}, using default 15 minutes`);
    return 900; // default 15 minutes
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * (multipliers[unit] || 60);
}
