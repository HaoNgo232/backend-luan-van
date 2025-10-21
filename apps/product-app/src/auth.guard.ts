import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';

/**
 * Product service authentication guard
 * Uses stateless JWT validation (no database checks)
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
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
