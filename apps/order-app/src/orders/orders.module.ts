import { Module } from '@nestjs/common';
import { OrdersService } from '@order-app/orders/orders.service';
import { OrdersController } from '@order-app/orders/orders.controller';
import { PrismaService } from '@order-app/prisma/prisma.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
