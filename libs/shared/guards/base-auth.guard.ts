import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@shared/jwt/jwt.service';
import type { JwtPayload } from '@shared/jwt/interfaces';

/**
 * Base authentication guard for all microservices
 * Provides common JWT token validation logic with extension points
 * for service-specific validation requirements.
 *
 * Uses JwtService for RSA-based token verification.
 *
 * @abstract
 * @example
 * // Simple stateless validation (default)
 * export class AuthGuard extends BaseAuthGuard {
 *   constructor(jwtService: JwtService) {
 *     super(jwtService);
 *   }
 * }
 *
 * @example
 * // With custom validation (e.g., database check)
 * export class AuthGuard extends BaseAuthGuard {
 *   constructor(
 *     jwtService: JwtService,
 *     private readonly prisma: PrismaService
 *   ) {
 *     super(jwtService);
 *   }
 *
 *   protected async validateUser(token: JwtPayload): Promise<boolean> {
 *     const user = await this.prisma.user.findUnique({ where: { id: token.userId } });
 *     return user?.isActive ?? false;
 *   }
 * }
 */
@Injectable()
export abstract class BaseAuthGuard implements CanActivate {
  /**
   * Inject JwtService for token verification
   * Subclasses must pass jwtService to super() in their constructor
   */
  constructor(protected readonly jwtService: JwtService) {}

  /**
   * Main guard entry point - validates authentication
   * @param context Execution context from NestJS
   * @returns Promise<boolean> or boolean indicating if request is authenticated
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Extract RPC message data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const message = context.switchToRpc().getData();

      // Validate message structure
      if (typeof message !== 'object' || message === null || !('headers' in message)) {
        this.logWarning('Invalid message format - missing headers');
        throw new UnauthorizedException('Authentication required');
      }

      // Extract and verify JWT token
      const headers = message.headers as Record<string, string>;
      const decodedToken = await this.extractAndVerifyToken(headers);

      if (!decodedToken) {
        this.logWarning('Token verification failed');
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Validate token structure
      this.validateTokenStructure(decodedToken);

      // Service-specific validation (hook for subclasses)
      const isValid = await this.validateUser(decodedToken, message);

      if (!isValid) {
        this.logWarning(`User validation failed for userId: ${decodedToken.userId}`);
        throw new UnauthorizedException('User validation failed');
      }

      // Log successful authentication
      this.logSuccess(decodedToken);

      // Attach user info to context for downstream use
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message.user = decodedToken;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logError('Unexpected error during authentication', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extract and verify JWT token from request headers
   * Uses JwtService for RSA-based verification
   *
   * @param headers Request headers
   * @returns Decoded JWT payload or null if invalid
   * @protected
   */
  protected async extractAndVerifyToken(
    headers: Record<string, string>,
  ): Promise<JwtPayload | null> {
    try {
      const authHeader = headers.authorization || headers.Authorization;

      if (!authHeader || typeof authHeader !== 'string') {
        return null;
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        return null;
      }

      // Use JwtService to verify token with RSA public key
      const decoded = await this.jwtService.verifyToken(token);
      return decoded;
    } catch (error) {
      this.logWarning(
        `Token verification error: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Validate token structure and required fields
   * @param token Decoded JWT payload
   * @throws UnauthorizedException if token structure is invalid
   * @protected
   */
  protected validateTokenStructure(token: JwtPayload): void {
    if (!token.userId || !token.email || !token.role) {
      this.logWarning('Token missing required fields');
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  /**
   * Service-specific user validation hook
   * Override this method in subclasses to add custom validation logic
   * (e.g., database checks, role verification, etc.)
   *
   * @param token Decoded and validated JWT payload
   * @param message RPC message context
   * @returns Promise<boolean> or boolean indicating if user is valid
   * @protected
   *
   * @example
   * // Default implementation - stateless validation
   * protected async validateUser(token: JwtPayload): Promise<boolean> {
   *   return true;
   * }
   *
   * @example
   * // Custom implementation with database check
   * protected async validateUser(token: JwtPayload): Promise<boolean> {
   *   const user = await this.prisma.user.findUnique({ where: { id: token.userId } });
   *   return user?.isActive ?? false;
   * }
   */
  protected async validateUser(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: JwtPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: unknown,
  ): Promise<boolean> {
    // Default: trust the token (stateless validation)
    // Subclasses can override for custom validation
    return true;
  }

  /**
   * Get service name for logging
   * Override to customize log prefix
   * @protected
   */
  protected getServiceName(): string {
    return 'AuthGuard';
  }

  /**
   * Log warning message
   * @param message Warning message
   * @protected
   */
  protected logWarning(message: string): void {
    console.warn(`[${this.getServiceName()}] ${message}`);
  }

  /**
   * Log error message
   * @param message Error message
   * @param error Error object
   * @protected
   */
  protected logError(message: string, error: unknown): void {
    console.error(`[${this.getServiceName()}] ${message}:`, error);
  }

  /**
   * Log successful authentication
   * @param token Decoded JWT payload
   * @protected
   */
  protected logSuccess(token: JwtPayload): void {
    console.log(`[${this.getServiceName()}] Authenticated user: ${token.userId} (${token.role})`);
  }
}
