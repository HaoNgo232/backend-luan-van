import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentProcessDto, PaymentVerifyDto } from '@shared/dto/payment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController extends BaseGatewayController {
  constructor(@Inject('PAYMENT_SERVICE') protected readonly service: ClientProxy) {
    super(service);
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
