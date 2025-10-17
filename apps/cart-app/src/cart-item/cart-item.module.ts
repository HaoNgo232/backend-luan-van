import { Module } from '@nestjs/common';
import { CartItemService } from '@cart-app/cart-item/cart-item.service';
import { CartItemController } from '@cart-app/cart-item/cart-item.controller';

@Module({
  providers: [CartItemService],
  controllers: [CartItemController],
})
export class CartItemModule {}
