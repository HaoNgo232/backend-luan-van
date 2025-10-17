import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
} from '@shared/dto/user.dto';

@Injectable()
export class UsersService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findById(_id: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByEmail(_email: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_dto: CreateUserDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_id: string, _dto: UpdateUserDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deactivate(_id: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_query: ListUsersDto) {}
}
