import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AddressCreateDto, AddressUpdateDto } from '@shared/dto/address.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';

/**
 * Addresses Controller
 * Manages user shipping addresses via ClientProxy
 */
@Controller('addresses')
@UseGuards(AuthGuard)
export class AddressesController extends BaseGatewayController {
  constructor(@Inject('USER_SERVICE') protected readonly service: ClientProxy) {
    super(service);
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
