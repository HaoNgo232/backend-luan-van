import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';

/**
 * Test Helper - Create Testing Module
 * Helper đơn giản để tạo NestJS testing module
 */
export const createTestingModule = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides: Record<string, any> = {},
): Promise<TestingModule> => {
  let builder = Test.createTestingModule({
    imports,
    providers,
  });

  // Override providers nếu có
  for (const [token, mock] of Object.entries(overrides)) {
    builder = builder.overrideProvider(token).useValue(mock);
  }

  return builder.compile();
};

/**
 * Generate test JWT token
 */
export const generateTestToken = (payload: {
  userId: string;
  email: string;
  role?: string;
}): string => {
  const secret = process.env.JWT_SECRET_KEY || 'test_secret';
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'CUSTOMER',
    },
    secret,
    { expiresIn: '1h' },
  );
};

/**
 * Create mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: null,
  role: 'CUSTOMER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock request with authentication
 */
export const createMockAuthRequest = (userId = '1', role = 'CUSTOMER') => ({
  headers: {
    authorization: `Bearer ${generateTestToken({ userId, email: 'test@example.com', role })}`,
  },
  user: {
    userId,
    email: 'test@example.com',
    role,
  },
});

/**
 * Wait for async operations (useful in tests)
 */
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
