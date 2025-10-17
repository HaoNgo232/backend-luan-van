import { Module } from '@nestjs/common';
import { OrderItemService } from '@order-app/order-item/order-item.service';

@Module({
  controllers: [],
  providers: [OrderItemService],
})
export class OrderItemModule {}
