import { Module } from '@nestjs/common';
import { PaymentsService } from '@payment-app/payments/payments.service';
import { PaymentsController } from '@payment-app/payments/payments.controller';
import { PrismaService } from '@payment-app/prisma/prisma.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
