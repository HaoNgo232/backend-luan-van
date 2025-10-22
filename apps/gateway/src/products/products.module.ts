import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';

@Module({
  controllers: [ProductsController, CategoriesController],
})
export class ProductsModule {}
