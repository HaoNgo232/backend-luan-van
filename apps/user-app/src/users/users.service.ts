import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
} from '@shared/dto/user.dto';
import { prisma } from '@user-app/prisma/prisma.client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  async findById(id: string): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[UsersService] findById error:', error);
      throw new BadRequestException('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<{
    id: string;
    email: string;
    passwordHash: string;
    fullName: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error('[UsersService] findByEmail error:', error);
      throw new BadRequestException('Failed to find user by email');
    }
  }

  async create(dto: CreateUserDto): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role || 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('[UsersService] create error:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
  }> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role,
          isActive: dto.isActive,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[UsersService] update error:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async deactivate(id: string): Promise<{ message: string }> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: `User ${id} deactivated successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[UsersService] deactivate error:', error);
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  async list(query: ListUsersDto): Promise<{
    users: Array<{
      id: string;
      email: string;
      fullName: string | null;
      phone: string | null;
      role: string;
      isActive: boolean;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const where = query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' as const } },
              {
                fullName: { contains: query.q, mode: 'insensitive' as const },
              },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[UsersService] list error:', error);
      throw new BadRequestException('Failed to list users');
    }
  }
}
