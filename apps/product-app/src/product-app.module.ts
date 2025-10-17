import { Module } from '@nestjs/common';
import { ProductsModule } from '@product-app/products/products.module';
import { CategoriesModule } from '@product-app/categories/categories.module';

@Module({
  imports: [ProductsModule, CategoriesModule],
})
export class ProductAppModule {}
