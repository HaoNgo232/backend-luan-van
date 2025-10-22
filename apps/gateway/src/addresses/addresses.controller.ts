import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AddressCreateDto, AddressUpdateDto } from '@shared/dto/address.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

/**
 * Addresses Controller
 * Manages user shipping addresses via ClientProxy
 */
@Controller('addresses')
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(@Inject('USER_SERVICE') private readonly userService: ClientProxy) {}

  /**
   * Forward request to microservice with retry mechanism
   */
  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.userService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({
          count: 1,
          delay: 5000,
        }),
        catchError(error => {
          console.error(`[Gateway] ${pattern} failed:`, error);
          throw new HttpException(
            error.message || 'Service communication failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  @Get()
  async list(@Req() req: Request & { user: { userId: string } }) {
    return this.sendWithRetry(EVENTS.ADDRESS.LIST_BY_USER, req.user.userId);
  }

  @Post()
  async create(@Req() req: Request & { user: { userId: string } }, @Body() dto: AddressCreateDto) {
    return this.sendWithRetry(EVENTS.ADDRESS.CREATE, { ...dto, userId: req.user.userId });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: AddressUpdateDto) {
    return this.sendWithRetry(EVENTS.ADDRESS.UPDATE, { id, ...dto });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.ADDRESS.DELETE, id);
  }

  @Put(':id/set-default')
  async setDefault(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string) {
    return this.sendWithRetry(EVENTS.ADDRESS.SET_DEFAULT, {
      userId: req.user.userId,
      addressId: id,
    });
  }
}
