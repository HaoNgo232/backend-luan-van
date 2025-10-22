import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { PaymentsModule } from '@payment-app/payments/payments.module';
import { PrismaService } from '@payment-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, PaymentsModule],
  controllers: [],
  providers: [PrismaService],
})
export class PaymentAppModule {}
