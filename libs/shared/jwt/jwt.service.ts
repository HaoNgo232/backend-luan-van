import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import * as jose from 'jose';

/**
 * JWT Service - RSA-based Token Signing and Verification
 *
 * This service handles JWT token operations using RSA asymmetric cryptography:
 * - User-app: Has private key for signing tokens
 * - Other services: Have public key for verifying tokens
 *
 * Keys are loaded from environment variables (base64-encoded PEM format).
 *
 * @example
 * // User-app signs tokens
 * const token = await jwtService.signToken({ userId, email, role }, 900);
 *
 * @example
 * // Other services verify tokens
 * const payload = await jwtService.verifyToken(token);
 */
@Injectable()
export class JwtService implements OnModuleInit {
  private privateKey: jose.KeyLike | null = null;
  private publicKey: jose.KeyLike | null = null;

  private readonly algorithm = 'RS256';
  private readonly issuer = 'luan-van-ecommerce';

  /**
   * Initialize service and load RSA keys from environment variables
   * Called automatically by NestJS on module initialization
   */
  async onModuleInit() {
    await this.loadKeys();
  }

  /**
   * Load RSA keys from environment variables
   *
   * Environment variables expected:
   * - JWT_PUBLIC_KEY_BASE64: Base64-encoded public key PEM (required for all services)
   * - JWT_PRIVATE_KEY_BASE64: Base64-encoded private key PEM (only for user-app)
   *
   * @throws Error if public key is missing or keys cannot be imported
   */
  private async loadKeys() {
    try {
      // Load public key (required for all services)
      const publicKeyBase64 = process.env.JWT_PUBLIC_KEY_BASE64;
      if (!publicKeyBase64) {
        throw new Error('JWT_PUBLIC_KEY_BASE64 environment variable is required');
      }

      const publicKeyPEM = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');
      this.publicKey = await jose.importSPKI(publicKeyPEM, this.algorithm);

      console.log('[JwtService] ✅ Public key loaded successfully');

      // Load private key (optional - only for user-app)
      const privateKeyBase64 = process.env.JWT_PRIVATE_KEY_BASE64;
      if (privateKeyBase64) {
        const privateKeyPEM = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
        this.privateKey = await jose.importPKCS8(privateKeyPEM, this.algorithm);
        console.log('[JwtService] ✅ Private key loaded successfully (signing enabled)');
      } else {
        console.log('[JwtService] ℹ️  Private key not loaded (verification-only mode)');
      }
    } catch (error) {
      console.error('[JwtService] ❌ Failed to load RSA keys:', error);
      throw new Error(
        `JWT key initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Sign JWT token with private key (RS256 algorithm)
   *
   * Only user-app should call this method (requires private key).
   *
   * @param payload Token payload (userId, email, role)
   * @param expiresInSeconds Expiration time in seconds
   * @returns Signed JWT token string
   * @throws Error if private key is not loaded
   *
   * @example
   * const token = await jwtService.signToken(
   *   { userId: '123', email: 'user@example.com', role: 'CUSTOMER' },
   *   900 // 15 minutes
   * );
   */
  async signToken(payload: jose.JWTPayload, expiresInSeconds: number): Promise<string> {
    if (!this.privateKey) {
      throw new Error(
        '[JwtService] Cannot sign token: Private key not loaded (set JWT_PRIVATE_KEY_BASE64)',
      );
    }

    try {
      const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: this.algorithm })
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setExpirationTime(`${expiresInSeconds}s`)
        .setSubject(payload.sub ?? '')
        .sign(this.privateKey);

      return token;
    } catch (error) {
      console.error('[JwtService] Error signing token:', error);
      throw new Error(
        `Failed to sign JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Verify JWT token with public key (RS256 algorithm)
   *
   * All services can call this method (requires only public key).
   * Validates signature, expiration, and issuer claims.
   *
   * @param token JWT token string
   * @returns Decoded and verified JWT payload
   * @throws UnauthorizedException if token is invalid, expired, or verification fails
   *
   * @example
   * try {
   *   const payload = await jwtService.verifyToken(token);
   *   console.log('User ID:', payload.userId);
   * } catch (error) {
   *   console.error('Invalid token:', error.message);
   * }
   */
  async verifyToken(token: string): Promise<jose.JWTPayload> {
    if (!this.publicKey) {
      throw new Error('[JwtService] Cannot verify token: Public key not loaded');
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.publicKey, {
        issuer: this.issuer,
      });

      return payload;
    } catch (error) {
      // Handle specific jose errors
      if (error instanceof jose.errors.JWTExpired) {
        throw new UnauthorizedException('Token has expired');
      }

      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        const claimError = error as jose.errors.JWTClaimValidationFailed;
        throw new UnauthorizedException(
          `Token validation failed: ${claimError.claim} claim invalid`,
        );
      }

      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        throw new UnauthorizedException('Token signature verification failed');
      }

      if (error instanceof jose.errors.JWSInvalid) {
        throw new UnauthorizedException('Token format is invalid');
      }

      // Generic error
      console.error('[JwtService] Token verification error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Decode JWT token without verification (for debugging only)
   *
   * ⚠️  WARNING: Does not validate signature or expiration!
   * Only use for logging, debugging, or inspecting token structure.
   *
   * @param token JWT token string
   * @returns Decoded token payload and header
   * @throws UnauthorizedException if token format is invalid
   *
   * @example
   * const { payload, header } = jwtService.decodeToken(token);
   * console.log('Algorithm:', header.alg);
   * console.log('User ID:', payload.userId);
   */
  decodeToken(token: string): { payload: jose.JWTPayload; header: jose.JWSHeaderParameters } {
    try {
      const payload = jose.decodeJwt(token);
      const header = jose.decodeProtectedHeader(token);

      return {
        payload,
        header,
      };
    } catch (error) {
      console.error('[JwtService] Token decode error:', error);
      throw new UnauthorizedException('Invalid token format');
    }
  }

  /**
   * Check if service can sign tokens (has private key loaded)
   *
   * @returns True if private key is loaded, false otherwise
   */
  canSignTokens(): boolean {
    return this.privateKey !== null;
  }

  /**
   * Check if service can verify tokens (has public key loaded)
   *
   * @returns True if public key is loaded, false otherwise
   */
  canVerifyTokens(): boolean {
    return this.publicKey !== null;
  }
}
