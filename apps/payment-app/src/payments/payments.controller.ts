import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { EVENTS } from '../../../../libs/shared/events';
import {
  PaymentProcessDto,
  PaymentVerifyDto,
  PaymentIdDto,
  PaymentByOrderDto,
} from '../../../../libs/shared/dto/payment.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern(EVENTS.PAYMENT.PROCESS)
  process(@Payload() dto: PaymentProcessDto) {
    return this.paymentsService.process(dto);
  }

  @MessagePattern(EVENTS.PAYMENT.VERIFY)
  verify(@Payload() dto: PaymentVerifyDto) {
    return this.paymentsService.verify(dto);
  }

  @MessagePattern(EVENTS.PAYMENT.GET_BY_ID)
  getById(@Payload() dto: PaymentIdDto) {
    return this.paymentsService.getById(dto);
  }

  @MessagePattern(EVENTS.PAYMENT.GET_BY_ORDER)
  getByOrder(@Payload() dto: PaymentByOrderDto) {
    return this.paymentsService.getByOrder(dto);
  }
}
