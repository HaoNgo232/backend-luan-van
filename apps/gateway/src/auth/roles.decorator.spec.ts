import 'reflect-metadata';
import { UserRole } from '@shared/dto/user.dto';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('@Roles() Decorator', () => {
  describe('ROLES_KEY constant', () => {
    it('should have correct value', () => {
      expect(ROLES_KEY).toBe('roles');
    });
  });

  describe('Roles decorator', () => {
    it('should set metadata with single role', () => {
      @Roles(UserRole.ADMIN)
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('should set metadata with multiple roles', () => {
      @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toEqual([UserRole.ADMIN, UserRole.CUSTOMER]);
    });

    it('should work on methods', () => {
      class TestController {
        @Roles(UserRole.ADMIN)
        testMethod(): void {}
      }

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('should work with empty roles array', () => {
      @Roles()
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toEqual([]);
    });

    it('should handle method-level decorator overriding class-level', () => {
      @Roles(UserRole.ADMIN)
      class TestController {
        @Roles(UserRole.CUSTOMER)
        testMethod(): void {}
      }

      const classMetadata = Reflect.getMetadata(ROLES_KEY, TestController);
      const methodMetadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);

      expect(classMetadata).toEqual([UserRole.ADMIN]);
      expect(methodMetadata).toEqual([UserRole.CUSTOMER]);
    });

    it('should be type-safe with UserRole enum', () => {
      // This test ensures TypeScript compilation works
      // If this compiles, it means the decorator accepts only UserRole values
      @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
      class TypeSafeController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TypeSafeController);
      expect(metadata).toEqual([UserRole.ADMIN, UserRole.CUSTOMER]);
    });

    it('should preserve order of roles', () => {
      @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toEqual([UserRole.CUSTOMER, UserRole.ADMIN]);
    });

    it('should work with duplicate roles', () => {
      @Roles(UserRole.ADMIN, UserRole.ADMIN, UserRole.CUSTOMER)
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toEqual([UserRole.ADMIN, UserRole.ADMIN, UserRole.CUSTOMER]);
    });
  });

  describe('Integration with NestJS metadata system', () => {
    it('should work with SetMetadata from @nestjs/common', () => {
      // This test ensures the decorator uses the correct NestJS metadata system
      @Roles(UserRole.ADMIN)
      class TestController {}

      // Check that metadata is stored correctly for NestJS Reflector
      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata).toContain(UserRole.ADMIN);
    });

    it('should be compatible with getAllAndOverride method', () => {
      // This test simulates how RolesGuard will use the metadata
      @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);

      // Simulate getAllAndOverride behavior
      const result = metadata || [];
      expect(result).toEqual([UserRole.ADMIN, UserRole.CUSTOMER]);
    });
  });
});
