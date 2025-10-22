import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CartAddItemDto, CartRemoveItemDto, CartGetDto } from '@shared/dto/cart.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';
import { CartResponse, TransferCartResponse } from '@shared/types/cart.types';
import { SuccessResponse } from '@shared/types/response.types';

/**
 * Cart Controller
 * Gateway endpoint cho shopping cart - forward requests đến cart-service
 */
@Controller('cart')
export class CartController extends BaseGatewayController {
  constructor(@Inject('CART_SERVICE') protected readonly client: ClientProxy) {
    super(client);
  }

  /**
   * GET /cart
   * Lấy cart theo userId hoặc sessionId
   */
  @Get()
  async get(@Query() query: CartGetDto): Promise<CartResponse> {
    return this.send<CartGetDto, CartResponse>(EVENTS.CART.GET, query);
  }

  /**
   * POST /cart/items
   * Thêm item vào cart
   */
  @Post('items')
  async addItem(@Body() dto: CartAddItemDto): Promise<CartResponse> {
    return this.send<CartAddItemDto, CartResponse>(EVENTS.CART.ADD_ITEM, dto);
  }

  /**
   * DELETE /cart/items
   * Xóa item khỏi cart
   */
  @Delete('items')
  async removeItem(@Body() dto: CartRemoveItemDto): Promise<CartResponse> {
    return this.send<CartRemoveItemDto, CartResponse>(EVENTS.CART.REMOVE_ITEM, dto);
  }

  /**
   * DELETE /cart
   * Xóa toàn bộ items trong cart
   */
  @Delete()
  async clear(@Query() query: CartGetDto): Promise<SuccessResponse> {
    return this.send<CartGetDto, SuccessResponse>(EVENTS.CART.CLEAR, query);
  }

  /**
   * POST /cart/transfer
   * Chuyển cart từ session sang user (khi user login)
   */
  @Post('transfer')
  @UseGuards(AuthGuard)
  async transferToUser(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { sessionId: string },
  ): Promise<TransferCartResponse> {
    return this.send<{ sessionId: string; userId: string }, TransferCartResponse>(
      EVENTS.CART.TRANSFER_TO_USER,
      {
        sessionId: body.sessionId,
        userId: req.user.userId,
      },
    );
  }
}
