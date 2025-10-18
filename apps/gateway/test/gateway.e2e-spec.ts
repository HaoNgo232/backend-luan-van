import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { of } from 'rxjs';

describe('Gateway (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let productService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cartService: any;

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
    await app.init();

    userService = moduleFixture.get('USER_SERVICE');
    productService = moduleFixture.get('PRODUCT_SERVICE');
    cartService = moduleFixture.get('CART_SERVICE');
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/by-id', () => {
    it('should return user data when service responds', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      userService.send.mockReturnValue(of(mockUser));

      const response = await request(app.getHttpServer())
        .get('/users/by-id?id=1')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(userService.send).toHaveBeenCalled();
    });
  });

  describe('GET /products/by-slug', () => {
    it('should return product data when service responds', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        priceInt: 1999,
      };

      productService.send.mockReturnValue(of(mockProduct));

      const response = await request(app.getHttpServer())
        .get('/products/by-slug?slug=test-product')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(productService.send).toHaveBeenCalled();
    });
  });

  describe('GET /cart', () => {
    it('should return cart data when service responds', async () => {
      const mockCart = {
        id: '1',
        sessionId: 'test-session',
        items: [],
      };

      cartService.send.mockReturnValue(of(mockCart));

      const response = await request(app.getHttpServer())
        .get('/cart?sessionId=test-session')
        .expect(200);

      expect(response.body).toEqual(mockCart);
      expect(cartService.send).toHaveBeenCalled();
    });
  });
});
