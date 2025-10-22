import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderCreateDto, OrderUpdateStatusDto, OrderListByUserDto } from '@shared/dto/order.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController extends BaseGatewayController {
  constructor(@Inject('ORDER_SERVICE') protected readonly service: ClientProxy) {
    super(service);
  }

  @Post()
  async create(@Req() req: Request & { user: { userId: string } }, @Body() dto: OrderCreateDto) {
    return this.sendWithRetry(EVENTS.ORDER.CREATE, { ...dto, userId: req.user.userId });
  }

  @Get()
  async list(
    @Req() req: Request & { user: { userId: string } },
    @Query() query: OrderListByUserDto,
  ) {
    return this.sendWithRetry(EVENTS.ORDER.LIST_BY_USER, {
      ...query,
      userId: req.user.userId,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.ORDER.GET, id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: OrderUpdateStatusDto) {
    return this.sendWithRetry(EVENTS.ORDER.UPDATE_STATUS, { ...dto, id });
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.ORDER.CANCEL, id);
  }
}
