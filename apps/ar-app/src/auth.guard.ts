import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verifyJwtFromHeader } from '@shared/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const message = context.switchToRpc().getData();
    if (
      typeof message === 'object' &&
      message !== null &&
      'headers' in message
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const token = verifyJwtFromHeader(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message.headers as Record<string, string>,
      );
      if (token) {
        return true;
      }
    }
    return false;
  }
}
