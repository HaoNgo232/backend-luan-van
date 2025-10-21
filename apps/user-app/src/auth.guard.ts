import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtPayload } from '@shared/auth';
import { PrismaService } from '@user-app/prisma/prisma.service';

/**
 * User service authentication guard with database validation
 * Extends BaseAuthGuard to add user existence and active status checks
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Validate user exists and is active in database
   * @param token Decoded JWT payload
   * @returns Promise<boolean> true if user exists and is active
   * @protected
   */
  protected async validateUser(token: JwtPayload): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: token.userId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user) {
        this.logWarning(`User not found: ${token.userId}`);
        return false;
      }

      if (!user.isActive) {
        this.logWarning(`User inactive: ${token.userId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Database validation error', error);
      return false;
    }
  }

  /**
   * Override service name for logging
   * @protected
   */
  protected getServiceName(): string {
    return 'UserService:AuthGuard';
  }
}
