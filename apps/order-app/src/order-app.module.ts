import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { OrderItemModule } from './order-item/order-item.module';

@Module({
  imports: [OrdersModule, OrderItemModule],
  controllers: [],
  providers: [],
})
export class OrderAppModule {}
