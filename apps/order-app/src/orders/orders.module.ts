import { Module } from '@nestjs/common';
import { OrdersService } from '@order-app/orders/orders.service';
import { OrdersController } from '@order-app/orders/orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
