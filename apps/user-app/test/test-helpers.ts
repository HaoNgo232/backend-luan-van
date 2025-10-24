import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAppModule } from '../src/user-app.module';
import { PrismaService } from '@user-app/prisma/prisma.service';

/**
 * Test Database Helper
 * Provides utilities for E2E testing with test database
 */
export class TestDatabaseHelper {
  private app: INestApplication;
  private prisma: PrismaService;

  async setupTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserAppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prisma = this.app.get<PrismaService>(PrismaService);

    await this.app.init();
    return this.app;
  }

  async cleanDatabase(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma service not initialized. Call setupTestApp first.');
    }

    // Xóa data theo thứ tự để tránh foreign key constraint
    await this.prisma.address.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }

  getApp(): INestApplication {
    return this.app;
  }
}

/**
 * Test Data Factory
 * Tạo dữ liệu test có tính nhất quán
 */
export class TestDataFactory {
  static createUserData(
    override: Partial<{
      email: string;
      password: string;
      fullName: string;
      phone: string;
      role: string;
    }> = {},
  ): {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
  } {
    return {
      email: `test-${Date.now()}@example.com`,
      password: 'Test@1234',
      fullName: 'Test User',
      phone: '0912345678',
      role: 'CUSTOMER',
      ...override,
    };
  }

  static createAddressData(
    userId: string,
    override: Partial<{
      fullName: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      isDefault: boolean;
    }> = {},
  ): {
    userId: string;
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
  } {
    return {
      userId,
      fullName: 'Test Recipient',
      phone: '0987654321',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: '123 Nguyễn Huệ',
      isDefault: false,
      ...override,
    };
  }

  static createLoginData(
    override: Partial<{
      email: string;
      password: string;
    }> = {},
  ): {
    email: string;
    password: string;
  } {
    return {
      email: 'test@example.com',
      password: 'Test@1234',
      ...override,
    };
  }
}
