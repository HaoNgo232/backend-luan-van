import { Module } from '@nestjs/common';
import { CartModule } from '@cart-app/cart/cart.module';
import { CartItemModule } from '@cart-app/cart-item/cart-item.module';

@Module({
  imports: [CartModule, CartItemModule],
  controllers: [],
  providers: [],
})
export class CartAppModule {}
