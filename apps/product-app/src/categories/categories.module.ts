import { Module } from '@nestjs/common';
import { CategoriesService } from '@product-app/categories/categories.service';
import { CategoriesController } from '@product-app/categories/categories.controller';
import { PrismaService } from '@product-app/prisma/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
