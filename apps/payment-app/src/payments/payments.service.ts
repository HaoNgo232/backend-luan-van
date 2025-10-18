import { Injectable } from '@nestjs/common';
import {
  PaymentProcessDto,
  PaymentVerifyDto,
  PaymentIdDto,
  PaymentByOrderDto,
} from '@shared/dto/payment.dto';

@Injectable()
export class PaymentsService {
  async process(_dto: PaymentProcessDto) {}

  async verify(_dto: PaymentVerifyDto) {}

  async getById(_dto: PaymentIdDto) {}

  async getByOrder(_dto: PaymentByOrderDto) {}
}
