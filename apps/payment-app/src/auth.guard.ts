import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtService } from '@shared/main';

/**
 * Payment service authentication guard
 * Uses stateless JWT validation with RSA public key
 * Payment operations are critical and require authentication
 * Additional payment-specific validations can be added here
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
    return 'PaymentService:AuthGuard';
  }

  // Uses default validateUser() implementation from BaseAuthGuard
  // Future enhancement: Add payment-specific validations
  // (e.g., verify user payment methods, fraud detection)
}
