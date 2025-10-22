import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtService } from '@shared/main';

/**
 * Product service authentication guard
 * Uses stateless JWT validation with RSA public key (no database checks)
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
    return 'ProductService:AuthGuard';
  }

  // Uses default validateUser() implementation from BaseAuthGuard
  // which performs stateless token validation only
}
