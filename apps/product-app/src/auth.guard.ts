import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyJwtFromHeader, JwtPayload } from '@shared/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Validate JWT token from message headers
   * @throws UnauthorizedException if token is invalid or missing
   */
  canActivate(context: ExecutionContext): boolean {
    try {
      // Get RPC context data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const message = context.switchToRpc().getData();

      // Validate message structure
      if (typeof message !== 'object' || message === null || !('headers' in message)) {
        console.warn('[AuthGuard] Invalid message format - missing headers');
        throw new UnauthorizedException('Authentication required');
      }

      // Extract and verify JWT token
      const headers = message.headers as Record<string, string>;
      const decodedToken: JwtPayload | null = verifyJwtFromHeader(headers);

      if (!decodedToken) {
        console.warn('[AuthGuard] Token verification failed');
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Validate required token fields
      if (!decodedToken.userId || !decodedToken.email || !decodedToken.role) {
        console.warn('[AuthGuard] Token missing required fields');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Log successful authentication (for audit purposes)
      console.log(`[AuthGuard] Authenticated user: ${decodedToken.userId} (${decodedToken.role})`);

      // Attach user info to context for downstream use
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message.user = decodedToken;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('[AuthGuard] Unexpected error during authentication:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
