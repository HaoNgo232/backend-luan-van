import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';

/**
 * Order service authentication guard
 * Uses stateless JWT validation
 * All order operations require authentication
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
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
