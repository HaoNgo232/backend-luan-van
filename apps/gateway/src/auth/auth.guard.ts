import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@shared/main';
import { Request } from 'express';
import * as jose from 'jose';
/**
 * Authentication Guard for Gateway
 * Validates JWT token locally using RSA public key (no microservice call needed!)
 *
 * Giống các microservices khác, Gateway verify token trực tiếp để tối ưu performance
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      // Verify token locally with RSA public key (FAST!)
      const payload = await this.jwtService.verifyToken(token);

      // Validate required fields
      if (!payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach user info to request
      request['user'] = {
        userId: payload.sub as string,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
