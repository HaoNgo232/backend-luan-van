/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@shared/dto/user.dto';

/**
 * Metadata key để lưu required roles
 * Được sử dụng bởi RolesGuard để retrieve metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator để chỉ định roles được phép truy cập endpoint
 *
 * @param roles - Một hoặc nhiều UserRole values
 *
 * @example Single role
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Post('users')
 * async createUser() { }
 * ```
 *
 * @example Multiple roles (OR logic)
 * ```typescript
 * @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
 * @Get('products')
 * async listProducts() { }
 * ```
 *
 * @example Class-level usage
 * ```typescript
 * @Controller('users')
 * @Roles(UserRole.ADMIN) // Apply to all methods in class
 * export class UsersController { }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
