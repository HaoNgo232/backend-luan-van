import { Injectable } from '@nestjs/common';
import { BaseAuthGuard } from '@shared/guards';
import { JwtPayload } from '@shared/auth';

/**
 * Report service authentication guard
 * Uses stateless JWT validation with role-based access consideration
 * Reports are typically admin-only, but validation happens at handler level
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  /**
   * Override service name for logging
   * @protected
   */
  protected getServiceName(): string {
    return 'ReportService:AuthGuard';
  }

  /**
   * Optional: Add role-based validation for reports
   * Uncomment to enforce admin-only access at guard level
   * @protected
   */
  // protected async validateUser(token: JwtPayload): Promise<boolean> {
  //   // Reports typically require admin role
  //   if (token.role !== 'admin') {
  //     this.logWarning(`Non-admin user attempted report access: ${token.userId}`);
  //     return false;
  //   }
  //   return true;
  // }
}
