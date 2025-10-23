import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { UserAppModule } from '../src/user-app.module';
import { EVENTS } from '@shared/events';
import { LoginDto, RefreshDto } from '@shared/dto/auth.dto';
import { CreateUserDto, UserRole } from '@shared/dto/user.dto';
import { firstValueFrom } from 'rxjs';

describe('AuthController (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let testUserEmail: string;
  let testUserPassword: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UserAppModule,
        ClientsModule.register([
          {
            name: 'USER_SERVICE_CLIENT',
            transport: Transport.NATS,
            options: {
              servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestMicroservice({
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'auth-test',
      },
    });

    await app.listen();
    client = moduleFixture.get('USER_SERVICE_CLIENT');
    await client.connect();

    // Create test user
    testUserEmail = `auth-test-${Date.now()}@example.com`;
    testUserPassword = 'Test@123456';

    const createDto: CreateUserDto = {
      email: testUserEmail,
      password: testUserPassword,
      fullName: 'Auth Test User',
      role: UserRole.CUSTOMER,
    };

    await firstValueFrom(client.send(EVENTS.USER.CREATE, createDto));
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should login successfully', async () => {
      const loginDto: LoginDto = {
        email: testUserEmail,
        password: testUserPassword,
      };

      const result = await firstValueFrom(client.send(EVENTS.AUTH.LOGIN, loginDto));

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUserEmail);

      accessToken = result.accessToken;
      refreshToken = result.refreshToken;
    });

    it('should fail login with wrong password', async () => {
      const loginDto: LoginDto = {
        email: testUserEmail,
        password: 'WrongPassword123',
      };

      await expect(firstValueFrom(client.send(EVENTS.AUTH.LOGIN, loginDto))).rejects.toThrow();
    });

    it('should verify valid token', async () => {
      const result = await firstValueFrom(client.send(EVENTS.AUTH.VERIFY, { token: accessToken }));

      expect(result).toBeDefined();
      expect(result.sub).toBeDefined();
      expect(result.email).toBe(testUserEmail);
    });

    it('should refresh token', async () => {
      const refreshDto: RefreshDto = {
        refreshToken,
      };

      const result = await firstValueFrom(client.send(EVENTS.AUTH.REFRESH, refreshDto));

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
