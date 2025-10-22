import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderCreateDto, OrderUpdateStatusDto, OrderListByUserDto } from '@shared/dto/order.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(@Inject('ORDER_SERVICE') private readonly orderService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.orderService.send<T>(pattern, data).pipe(
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
