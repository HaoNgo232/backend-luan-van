import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtService } from '@shared/main';

/**
 * Cart service authentication guard
 * Uses stateless JWT validation with RSA public key
 * All cart operations require authentication
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
    return 'CartService:AuthGuard';
  }

  // Uses default validateUser() implementation from BaseAuthGuard
  // Cart service trusts JWT tokens without additional database checks
  // for performance optimization
}
