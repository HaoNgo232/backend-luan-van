/**
 * RPC Test Helpers
 * Reusable utilities for E2E testing with NATS microservices
 */

/**
 * Assert NATS RpcException errors
 *
 * NATS errors are emitted through Observable error stream,
 * not thrown as regular exceptions.
 *
 * @example
 * await expectRpcError(
 *   firstValueFrom(client.send(EVENTS.USER.GET, 'invalid-id')),
 *   'không tồn tại'
 * );
 */
export const expectRpcError = async (
  promise: Promise<unknown>,
  expectedMessage?: string,
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected RpcException but got success');
  } catch (error: unknown) {
    expect(error).toBeDefined();

    if (expectedMessage) {
      const err = error as Record<string, unknown>;
      const msg =
        (typeof err.message === 'string' ? err.message : '') ||
        (typeof err.msg === 'string' ? err.msg : '') ||
        '';
      expect(msg).toContain(expectedMessage);
    }
  }
};

/**
 * Assert RPC error with status code
 *
 * @example
 * await expectRpcErrorWithStatus(
 *   firstValueFrom(client.send(EVENTS.USER.GET, 'invalid-id')),
 *   404,
 *   'không tồn tại'
 * );
 */
export const expectRpcErrorWithStatus = async (
  promise: Promise<unknown>,
  expectedStatusCode: number,
  expectedMessage?: string,
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected RpcException but got success');
  } catch (error: unknown) {
    expect(error).toBeDefined();

    const err = error as Record<string, unknown>;

    // Check status code
    if (typeof err.statusCode === 'number') {
      expect(err.statusCode).toBe(expectedStatusCode);
    }

    // Check message if provided
    if (expectedMessage) {
      const msg =
        (typeof err.message === 'string' ? err.message : '') ||
        (typeof err.msg === 'string' ? err.msg : '') ||
        '';
      expect(msg).toContain(expectedMessage);
    }
  }
};

/**
 * Create unique test email
 *
 * @example
 * const email = createTestEmail('user');
 * // Returns: user-1234567890@test.com
 */
export const createTestEmail = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}@test.com`;
};

/**
 * Create unique test identifier
 *
 * @example
 * const id = createTestId('user');
 * // Returns: user-1234567890
 */
export const createTestId = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}`;
};
