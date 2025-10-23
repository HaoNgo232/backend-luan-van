import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@shared/dto/user.dto';
import { UserResponse } from '@shared/types/user.types';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  describe('Happy Path Tests', () => {
    it('should allow access when no @Roles() decorator present', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when required roles is empty array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user role matches single required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user role matches one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.CUSTOMER]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has ADMIN role and endpoint requires ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has CUSTOMER role and endpoint requires CUSTOMER', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should throw ForbiddenException when user role does not match', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/Required roles: \[ADMIN\]/);
      expect(() => guard.canActivate(context)).toThrow(/Your role: CUSTOMER/);
    });

    it('should throw ForbiddenException when user is missing from request', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({});

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/User not found in request/);
    });

    it('should throw ForbiddenException when user is null', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({ user: null });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/User not found in request/);
    });

    it('should throw ForbiddenException when user is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({ user: undefined });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/User not found in request/);
    });

    it('should throw ForbiddenException when user.role is missing', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com' }, // Missing role
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user.role is null', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: null },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user.role is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: undefined },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user.role is empty string', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: '' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Edge Case Tests', () => {
    it('should check both method and class level decorators', () => {
      const getAllAndOverrideSpy = reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'admin@test.com', role: 'ADMIN' },
      });

      guard.canActivate(context);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should include user role in error message', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(() => guard.canActivate(context)).toThrow(/Your role: CUSTOMER/);
    });

    it('should include required roles in error message', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.CUSTOMER]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'GUEST' },
      });

      expect(() => guard.canActivate(context)).toThrow(/Required roles: \[ADMIN, CUSTOMER\]/);
    });

    it('should handle single required role in error message', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(() => guard.canActivate(context)).toThrow(/Required roles: \[ADMIN\]/);
    });

    it('should work with UserResponse type assertion', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const userResponse: UserResponse = {
        id: '123',
        email: 'admin@test.com',
        fullName: 'Admin User',
        phone: '+1234567890',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context = createMockContext({ user: userResponse });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Role Matching Logic', () => {
    it('should use OR logic for multiple roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.CUSTOMER]);

      // Test with ADMIN role
      const adminContext = createMockContext({
        user: { userId: '123', email: 'admin@test.com', role: 'ADMIN' },
      });
      expect(guard.canActivate(adminContext)).toBe(true);

      // Test with CUSTOMER role
      const customerContext = createMockContext({
        user: { userId: '456', email: 'customer@test.com', role: 'CUSTOMER' },
      });
      expect(guard.canActivate(customerContext)).toBe(true);

      // Test with invalid role
      const invalidContext = createMockContext({
        user: { userId: '789', email: 'guest@test.com', role: 'GUEST' },
      });
      expect(() => guard.canActivate(invalidContext)).toThrow(ForbiddenException);
    });

    it('should be case sensitive for role matching', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'admin' }, // lowercase
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle exact role matching', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.CUSTOMER]);

      const context = createMockContext({
        user: { userId: '123', email: 'customer@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Reflector Integration', () => {
    it('should call getAllAndOverride with correct parameters', () => {
      const getAllAndOverrideSpy = reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const context = createMockContext({
        user: { userId: '123', email: 'admin@test.com', role: 'ADMIN' },
      });

      guard.canActivate(context);

      expect(getAllAndOverrideSpy).toHaveBeenCalledTimes(1);
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should handle getAllAndOverride returning null', () => {
      reflector.getAllAndOverride.mockReturnValue(null);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle getAllAndOverride returning undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockContext({
        user: { userId: '123', email: 'test@test.com', role: 'CUSTOMER' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
