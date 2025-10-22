import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { ProductsModule } from '@product-app/products/products.module';
import { CategoriesModule } from '@product-app/categories/categories.module';
import { PrismaService } from '@product-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, ProductsModule, CategoriesModule],
  providers: [PrismaService],
})
export class ProductAppModule {}
