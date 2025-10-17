import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { EVENTS } from '../../../../libs/shared/events';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
} from '../../../../libs/shared/dto/user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(EVENTS.USER.FIND_BY_ID)
  findById(@Payload() id: string) {
    return this.usersService.findById(id);
  }

  @MessagePattern(EVENTS.USER.FIND_BY_EMAIL)
  findByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern(EVENTS.USER.CREATE)
  create(@Payload() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @MessagePattern(EVENTS.USER.UPDATE)
  update(@Payload() payload: { id: string; dto: UpdateUserDto }) {
    return this.usersService.update(payload.id, payload.dto);
  }

  @MessagePattern(EVENTS.USER.DEACTIVATE)
  deactivate(@Payload() id: string) {
    return this.usersService.deactivate(id);
  }

  @MessagePattern(EVENTS.USER.LIST)
  list(@Payload() query: ListUsersDto) {
    return this.usersService.list(query);
  }
}
