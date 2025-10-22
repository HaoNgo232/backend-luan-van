import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentProcessDto, PaymentVerifyDto } from '@shared/dto/payment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(@Inject('PAYMENT_SERVICE') private readonly paymentService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.paymentService.send<T>(pattern, data).pipe(
        timeout(10000), // Payments cần timeout dài hơn
        retry({ count: 1, delay: 1000 }),
        catchError(error => {
          throw new HttpException(
            error.message || 'Payment service failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  @Post('process')
  async process(@Body() dto: PaymentProcessDto) {
    return this.sendWithRetry(EVENTS.PAYMENT.PROCESS, dto);
  }

  @Post('verify')
  async verify(@Body() dto: PaymentVerifyDto) {
    return this.sendWithRetry(EVENTS.PAYMENT.VERIFY, dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.PAYMENT.GET_BY_ID, id);
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.sendWithRetry(EVENTS.PAYMENT.GET_BY_ORDER, orderId);
  }
}
