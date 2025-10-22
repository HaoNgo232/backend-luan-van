/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { of, throwError } from 'rxjs';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userService: Record<string, jest.Mock>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('USER_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('PRODUCT_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('CART_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('ORDER_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('PAYMENT_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('AR_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider('REPORT_SERVICE')
      .useValue({
        send: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation as main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    userService = moduleFixture.get('USER_SERVICE');
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 900,
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'CUSTOMER',
        },
      };

      userService.send.mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 401 when credentials are invalid', async () => {
      userService.send.mockReturnValue(
        throwError(() => ({ message: 'Invalid email or password' })),
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(500); // Gateway will convert NATS error to 500
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 900,
      };

      userService.send.mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid_refresh_token',
        })
        .expect(201);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 when refresh token is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user through user service', async () => {
      const registerPayload = {
        email: 'new-user@example.com',
        password: 'SecurePass123',
        fullName: 'New User',
      };

      const mockResponse = {
        id: 'user-123',
        email: registerPayload.email,
        fullName: registerPayload.fullName,
      };

      userService.send.mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(userService.send).toHaveBeenCalledWith('auth.register', registerPayload);
    });
  });

  describe('GET /auth/me (protected route)', () => {
    it('should return user data with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'CUSTOMER',
      };

      userService.send.mockReturnValue(of(mockUser));

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should return 401 when token is missing', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      userService.send.mockReturnValue(
        throwError(() => ({ message: 'Invalid token' })),
      );

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(500);
    });
  });
});
