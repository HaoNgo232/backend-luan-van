import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@shared/main';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let jwtService: jest.Mocked<JwtService>;
  let guard: AuthGuard;

  const createContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    guard = new AuthGuard(jwtService);
  });

  it('allows requests with a valid bearer token and attaches user', async () => {
    const mockPayload = {
      sub: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    };

    jwtService.verifyToken.mockResolvedValue(mockPayload);

    const request = {
      headers: {
        authorization: 'Bearer valid.token',
      },
    };

    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(jwtService.verifyToken).toHaveBeenCalledWith('valid.token');
    expect(request['user']).toEqual({
      userId: mockPayload.sub,
      email: mockPayload.email,
      role: mockPayload.role,
    });
  });

  it('throws UnauthorizedException when authorization header is missing', async () => {
    const request = {
      headers: {},
    };

    const context = createContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when token verification fails', async () => {
    jwtService.verifyToken.mockRejectedValue(new Error('boom'));

    const request = {
      headers: {
        authorization: 'Bearer invalid.token',
      },
    };

    const context = createContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyToken).toHaveBeenCalledWith('invalid.token');
  });
});
