import { Injectable } from '@nestjs/common';
import {
  PaymentProcessDto,
  PaymentVerifyDto,
  PaymentIdDto,
  PaymentByOrderDto,
} from '../../../../libs/shared/dto/payment.dto';

@Injectable()
export class PaymentsService {
  async process(dto: PaymentProcessDto) {}

  async verify(dto: PaymentVerifyDto) {}

  async getById(dto: PaymentIdDto) {}

  async getByOrder(dto: PaymentByOrderDto) {}
}
