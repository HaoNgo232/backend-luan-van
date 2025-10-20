import { Module } from '@nestjs/common';
import { OrderItemService } from '@order-app/order-item/order-item.service';
import { OrderItemController } from '@order-app/order-item/order-item.controller';
import { PrismaService } from '@order-app/prisma/prisma.service';

@Module({
  controllers: [OrderItemController],
  providers: [OrderItemService, PrismaService],
  exports: [OrderItemService],
})
export class OrderItemModule {}
