import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { UserAppModule } from '../src/user-app.module';
import { EVENTS } from '@shared/events';
import { CreateUserDto, UpdateUserDto, UserRole } from '@shared/dto/user.dto';
import { firstValueFrom } from 'rxjs';

describe('UsersController (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;

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
        queue: 'user-app-test',
      },
    });

    await app.listen();
    client = moduleFixture.get('USER_SERVICE_CLIENT');
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  describe('User CRUD Operations', () => {
    let createdUserId: string;

    it('should create a new user', async () => {
      const createDto: CreateUserDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test@123456',
        fullName: 'Test User',
        phone: '0123456789',
        role: UserRole.CUSTOMER,
      };

      const result = await firstValueFrom(client.send(EVENTS.USER.CREATE, createDto));

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(createDto.email);
      expect(result.fullName).toBe(createDto.fullName);
      expect(result.role).toBe(UserRole.CUSTOMER);

      createdUserId = result.id;
    });

    it('should find user by ID', async () => {
      const result = await firstValueFrom(client.send(EVENTS.USER.FIND_BY_ID, createdUserId));

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUserId);
      expect(result.email).toBeDefined();
    });

    it('should find user by email', async () => {
      const user = await firstValueFrom(client.send(EVENTS.USER.FIND_BY_ID, createdUserId));

      const result = await firstValueFrom(client.send(EVENTS.USER.FIND_BY_EMAIL, user.email));

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUserId);
    });

    it('should update user', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Updated User Name',
        phone: '0987654321',
      };

      const result = await firstValueFrom(
        client.send(EVENTS.USER.UPDATE, { id: createdUserId, dto: updateDto }),
      );

      expect(result).toBeDefined();
      expect(result.fullName).toBe(updateDto.fullName);
      expect(result.phone).toBe(updateDto.phone);
    });

    it('should list users with pagination', async () => {
      const result = await firstValueFrom(client.send(EVENTS.USER.LIST, { page: 1, pageSize: 10 }));

      expect(result).toBeDefined();
      expect(result.users).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });

    it('should deactivate user', async () => {
      const result = await firstValueFrom(client.send(EVENTS.USER.DEACTIVATE, createdUserId));

      expect(result).toBeDefined();
      expect(result.message).toContain('deactivated');
    });
  });
});
