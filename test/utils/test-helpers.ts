import { Test, TestingModule } from '@nestjs/testing';

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
