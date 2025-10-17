import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verifyJwtFromHeader } from '@shared/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const message = context.switchToRpc().getData();
    if (
      typeof message === 'object' &&
      message !== null &&
      'headers' in message
    ) {
      const token = verifyJwtFromHeader(message.headers);
      if (token) {
        return true;
      }
    }
    return false;
  }
}
