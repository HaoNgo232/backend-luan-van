import { Module } from '@nestjs/common';
import { ProductsService } from '@product-app/products/products.service';
import { ProductsController } from '@product-app/products/products.controller';
import { PrismaService } from '@product-app/prisma/prisma.service';
import { ProductMapper } from '@product-app/products/mappers/product.mapper';
import { ProductValidator } from '@product-app/products/validators/product.validator';
import { ProductQueryBuilder } from '@product-app/products/builders/product-query.builder';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, ProductMapper, ProductValidator, ProductQueryBuilder],
  exports: [ProductsService],
})
export class ProductsModule {}
