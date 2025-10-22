import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CartAddItemDto, CartRemoveItemDto, CartGetDto } from '@shared/dto/cart.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('cart')
export class CartController {
  constructor(@Inject('CART_SERVICE') private readonly cartService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.cartService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({ count: 1, delay: 1000 }),
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
