import { Test, TestingModule } from '@nestjs/testing';
import * as jose from 'jose';
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
export const generateTestToken = async (payload: {
  userId: string;
  email: string;
  role?: string;
}): Promise<string> => {
  const secret = process.env.JWT_SECRET_KEY || 'test_secret';

  const privateKey = await jose.importPKCS8(secret, 'HS256');

  const testToken = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('test')
    .setExpirationTime('1h')
    .setSubject(payload.userId)
    .sign(privateKey);

  return testToken;
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
export const createMockAuthRequest = async (
  userId = '1',
  role = 'CUSTOMER',
): Promise<{
  headers: { authorization: string };
  user: { userId: string; email: string; role: string };
}> => {
  const payload = { userId, email: 'test@example.com', role };
  const token = await generateTestToken(payload);

  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: {
      userId,
      email: 'test@example.com',
      role,
    },
  };
};

/**
 * Wait for async operations (useful in tests)
 */
export const waitFor = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
