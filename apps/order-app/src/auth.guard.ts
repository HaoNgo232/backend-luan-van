import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtService } from '@shared/main';

/**
 * Order service authentication guard
 * Uses stateless JWT validation with RSA public key
 * All order operations require authentication
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  constructor(jwtService: JwtService) {
    super(jwtService);
  }

  /**
   * Override service name for logging
   * @protected
   */
  protected getServiceName(): string {
    return 'OrderService:AuthGuard';
  }

  // Uses default validateUser() implementation from BaseAuthGuard
  // Order service trusts JWT tokens for performance
}
