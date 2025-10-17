import { Module } from '@nestjs/common';
import { PaymentsService } from '@payment-app/payments/payments.service';
import { PaymentsController } from '@payment-app/payments/payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
