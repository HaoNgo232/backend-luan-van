import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, ListUsersDto } from '@shared/dto/user.dto';
import { ListUsersResponse, UserResponse } from '@shared/main';
import { prisma } from '@user-app/prisma/prisma.client';
import * as bcrypt from 'bcryptjs';

export interface IUserService {
  findById(id: string): Promise<UserResponse>;
  findByEmail(email: string): Promise<UserResponse>;
  create(dto: CreateUserDto): Promise<UserResponse>;
  update(id: string, dto: UpdateUserDto): Promise<UserResponse>;
  deactivate(id: string): Promise<{ message: string }>;
  list(query: ListUsersDto): Promise<ListUsersResponse>;
}

@Injectable()
export class UsersService implements IUserService {
  async findById(id: string): Promise<UserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[UsersService] findById error:', error);
      throw new BadRequestException('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<UserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[UsersService] findByEmail error:', error);
      throw new BadRequestException('Failed to find user by email');
    }
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
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
      });

      if (!user) {
        throw new BadRequestException('Failed to create user');
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[UsersService] create error:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    try {
      await this.validateUserExists(id);

      const user = await prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role,
          isActive: dto.isActive,
        },
        select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true },
      });

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[UsersService] update error:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async deactivate(id: string): Promise<{ message: string }> {
    try {
      await this.validateUserExists(id);

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: `User ${id} deactivated successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[UsersService] deactivate error:', error);
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  async list(query: ListUsersDto): Promise<ListUsersResponse> {
    try {
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const where = query.search
        ? {
            OR: [
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return { users, total, page, pageSize };
    } catch (error) {
      console.error('[UsersService] list error:', error);
      throw new BadRequestException('Failed to list users');
    }
  }

  private async validateUserExists(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
