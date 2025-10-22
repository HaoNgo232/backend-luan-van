import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, UpdateUserDto, ListUsersDto } from '@shared/dto/user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('users')
export class UsersController {
  constructor(@Inject('USER_SERVICE') private readonly userService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.userService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({ count: 1, delay: 5000 }),
        catchError(error => {
          throw new HttpException(
            error.message || 'Service communication failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  async list(@Query() query: ListUsersDto) {
    return this.sendWithRetry(EVENTS.USER.LIST, query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findById(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.USER.FIND_BY_ID, id);
  }

  @Get('email/:email')
  @UseGuards(AuthGuard)
  async findByEmail(@Param('email') email: string) {
    return this.sendWithRetry(EVENTS.USER.FIND_BY_EMAIL, email);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CreateUserDto) {
    return this.sendWithRetry(EVENTS.USER.CREATE, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.sendWithRetry(EVENTS.USER.UPDATE, { id, ...dto });
  }

  @Put(':id/deactivate')
  @UseGuards(AuthGuard)
  async deactivate(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.USER.DEACTIVATE, id);
  }
}
