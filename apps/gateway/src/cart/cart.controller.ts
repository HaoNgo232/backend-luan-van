import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CartAddItemDto, CartRemoveItemDto, CartGetDto } from '@shared/dto/cart.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';

@Controller('cart')
export class CartController extends BaseGatewayController {
  constructor(@Inject('CART_SERVICE') protected readonly service: ClientProxy) {
    super(service);
  }

  @Get()
  async get(@Query() query: CartGetDto) {
    return this.sendWithRetry(EVENTS.CART.GET, query);
  }

  @Post('items')
  async addItem(@Body() dto: CartAddItemDto) {
    return this.sendWithRetry(EVENTS.CART.ADD_ITEM, dto);
  }

  @Delete('items')
  async removeItem(@Body() dto: CartRemoveItemDto) {
    return this.sendWithRetry(EVENTS.CART.REMOVE_ITEM, dto);
  }

  @Delete()
  async clear(@Query() query: CartGetDto) {
    return this.sendWithRetry(EVENTS.CART.CLEAR, query);
  }

  @Post('transfer')
  @UseGuards(AuthGuard)
  async transferToUser(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { sessionId: string },
  ) {
    return this.sendWithRetry(EVENTS.CART.TRANSFER_TO_USER, {
      sessionId: body.sessionId,
      userId: req.user.userId,
    });
  }
}
