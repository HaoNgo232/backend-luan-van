import { Module } from '@nestjs/common';
import { PaymentsModule } from '@payment-app/payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [],
  providers: [],
})
export class PaymentAppModule {}
