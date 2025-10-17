import { Module } from '@nestjs/common';
import { CategoriesService } from '@product-app/categories/categories.service';

@Module({
  providers: [CategoriesService],
})
export class CategoriesModule {}
