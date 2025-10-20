import { Module } from '@nestjs/common';
import { CartService } from '@cart-app/cart/cart.service';
import { CartController } from '@cart-app/cart/cart.controller';
import { PrismaService } from '@cart-app/prisma/prisma.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
