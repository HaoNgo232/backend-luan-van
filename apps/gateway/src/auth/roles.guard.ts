import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@shared/dto/user.dto';
import { ROLES_KEY } from './roles.decorator';
import { UserResponse } from '@shared/types/user.types';

/**
 * Authorization Guard - Kiểm tra user có role phù hợp để truy cập endpoint
 *
 * QUAN TRỌNG: Guard này phải được sử dụng CÙNG VỚI AuthGuard
 * và AuthGuard phải chạy TRƯỚC để attach user vào request
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(AuthGuard, RolesGuard)  // ← Đúng order!
 * export class UsersController { }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 1: Lấy required roles từ @Roles() decorator
    // getAllAndOverride checks both method and class decorators
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Method-level decorator
      context.getClass(), // Class-level decorator
    ]);

    // Step 2: Nếu không có @Roles() decorator → allow access
    // Endpoint chỉ cần authentication, không cần authorization
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Step 3: Lấy user từ request (đã được AuthGuard attach)
    const request = context.switchToHttp().getRequest<Request>();

    if (!request['user']) {
      throw new ForbiddenException('User not found in request');
    }

    const user = request['user'] as UserResponse;

    // Step 5: Check if user's role matches any required roles (OR logic)
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your role: ${user.role}`,
      );
    }

    // Step 6: Authorization successful
    return true;
  }
}
