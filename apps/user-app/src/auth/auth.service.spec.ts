import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '@shared/dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('@user-app/prisma/prisma.client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

import { prisma } from '@user-app/prisma/prisma.client';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Set test environment variables
    process.env.JWT_SECRET_KEY = 'test_secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user data on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        role: 'CUSTOMER',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: LoginDto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verify', () => {
    it('should return decoded token when valid', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      const mockUser = {
        id: '1',
        isActive: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.verify({ token: 'valid_token' });

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      await expect(service.verify({ token: 'invalid_token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('token expired', new Date());
      });

      await expect(service.verify({ token: 'expired_token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      const mockUser = {
        id: '1',
        isActive: false,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.verify({ token: 'valid_token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isActive: true,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new_token');

      const result = await service.refresh({ refreshToken: 'valid_refresh' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid_refresh' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
