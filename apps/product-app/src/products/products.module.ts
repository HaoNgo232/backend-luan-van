import { Module } from '@nestjs/common';
import { ProductsService } from '@product-app/products/products.service';
import { ProductsController } from '@product-app/products/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
