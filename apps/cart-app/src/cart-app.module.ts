import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { CartModule } from '@cart-app/cart/cart.module';
import { CartItemModule } from '@cart-app/cart-item/cart-item.module';
import { PrismaService } from '@cart-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, CartModule, CartItemModule],
  controllers: [],
  providers: [PrismaService],
})
export class CartAppModule {}
