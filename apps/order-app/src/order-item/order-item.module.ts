import { Module } from '@nestjs/common';
import { OrderItemService } from './order-item.service';

@Module({
  controllers: [],
  providers: [OrderItemService],
})
export class OrderItemModule {}
