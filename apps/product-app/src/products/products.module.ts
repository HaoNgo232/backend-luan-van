import { Module } from '@nestjs/common';
import { ProductsService } from '@product-app/products/products.service';
import { ProductsController } from '@product-app/products/products.controller';
import { PrismaService } from '@product-app/prisma/prisma.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
  exports: [ProductsService],
})
export class ProductsModule {}
