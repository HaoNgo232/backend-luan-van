import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserRole } from '@shared/dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@user-app/prisma/prisma.client';
import { UserResponse } from '@shared/main';

// Mock Prisma
jest.mock('@user-app/prisma/prisma.client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser: UserResponse = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '1234567890',
        role: 'CUSTOMER',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create new user successfully', async () => {
      const createDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
      };

      const mockCreatedUser = {
        id: '1',
        email: createDto.email,
        fullName: createDto.fullName,
        phone: null,
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email exists', async () => {
      const createDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: createDto.email,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
        phone: '9876543210',
        role: UserRole.ADMIN,
        isActive: true,
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        fullName: updateDto.fullName,
        phone: updateDto.phone,
        role: 'CUSTOMER',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('999', { fullName: 'Test', role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated user list', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          fullName: 'User 1',
          phone: null,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, pageSize: 10 });

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it('should filter users by search query', async () => {
      const mockUsers: UserResponse[] = [
        {
          id: '1',
          email: 'john@example.com',
          fullName: 'John Doe',
          phone: null,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await service.list({ search: 'john', page: 1, pageSize: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'john', mode: 'insensitive' } },
              { fullName: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });
});
