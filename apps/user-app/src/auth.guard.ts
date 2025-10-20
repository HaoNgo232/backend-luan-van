import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyJwtFromHeader, JwtPayload } from '@shared/auth';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const message: Record<string, unknown> = context.switchToRpc().getData();

      if (
        typeof message !== 'object' ||
        message === null ||
        !('headers' in message)
      ) {
        throw new UnauthorizedException('Invalid request format');
      }

      const token = verifyJwtFromHeader(
        message.headers as Record<string, string>,
      );

      if (!token) {
        throw new UnauthorizedException('Invalid or missing token');
      }

      // Verify user exists and is active in database
      const user = await this.prisma.user.findUnique({
        where: { id: token.userId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Attach user to message for use in handlers
      message.user = token;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthGuard] Verification error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
