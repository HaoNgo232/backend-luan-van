import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';

/**
 * AR (Augmented Reality) service authentication guard
 * Uses stateless JWT validation
 * AR snapshot operations require authenticated users
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  /**
   * Override service name for logging
   * @protected
   */
  protected getServiceName(): string {
    return 'ARService:AuthGuard';
  }

  // Uses default validateUser() implementation from BaseAuthGuard
  // AR service trusts JWT tokens for performance
}
