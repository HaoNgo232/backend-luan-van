import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
} from '@shared/dto/user.dto';

@Injectable()
export class UsersService {
  async findById(id: string) {}

  async findByEmail(email: string) {}

  async create(dto: CreateUserDto) {}

  async update(id: string, dto: UpdateUserDto) {}

  async deactivate(id: string) {}

  async list(query: ListUsersDto) {}
}
