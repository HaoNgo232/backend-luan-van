import { Module } from '@nestjs/common';
import { OrdersModule } from '@order-app/orders/orders.module';
import { OrderItemModule } from '@order-app/order-item/order-item.module';

@Module({
  imports: [OrdersModule, OrderItemModule],
  controllers: [],
  providers: [],
})
export class OrderAppModule {}
