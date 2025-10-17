import { Injectable } from '@nestjs/common';
import {
  PaymentProcessDto,
  PaymentVerifyDto,
  PaymentIdDto,
  PaymentByOrderDto,
} from '@shared/dto/payment.dto';

@Injectable()
export class PaymentsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(_dto: PaymentProcessDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(_dto: PaymentVerifyDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getById(_dto: PaymentIdDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getByOrder(_dto: PaymentByOrderDto) {}
}
