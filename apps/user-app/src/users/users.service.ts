import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
} from '@shared/dto/user.dto';

@Injectable()
export class UsersService {
  async findById(_id: string) {}

  async findByEmail(_email: string) {}

  async create(_dto: CreateUserDto) {}

  async update(_id: string, _dto: UpdateUserDto) {}

  async deactivate(_id: string) {}

  async list(_query: ListUsersDto) {}
}
