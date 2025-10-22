import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtService } from '@shared/main';
import { PrismaService } from '@user-app/prisma/prisma.service';
import * as jose from 'jose';

/**
 * User service authentication guard with database validation
 * Extends BaseAuthGuard to add user existence and active status checks
 * Uses RSA public key for token verification
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  constructor(
    jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    super(jwtService);
  }

  /**
   * Validate user exists and is active in database
   * @param token Decoded JWT payload
   * @returns Promise<boolean> true if user exists and is active
   * @protected
   */
  protected async validateUser(payload: jose.JWTPayload): Promise<boolean> {
    try {
      if (!payload.sub) {
        throw new Error('Token payload must contain sub claim');
      }

      // Get userId from sub claim (JOSE standard)
      const userId = payload.sub;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user) {
        this.logWarning(`User not found: ${userId}`);
        return false;
      }

      if (!user.isActive) {
        this.logWarning(`User inactive: ${userId}`);
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
