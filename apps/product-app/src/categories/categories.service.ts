import { Injectable } from '@nestjs/common';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryIdDto,
  CategorySlugDto,
  CategoryListQueryDto,
} from '@shared/dto/category.dto';

@Injectable()
export class CategoriesService {
  async getById(_dto: CategoryIdDto) {}

  async getBySlug(_dto: CategorySlugDto) {}

  async list(_query: CategoryListQueryDto) {}

  async create(_dto: CategoryCreateDto) {}

  async update(_id: string, _dto: CategoryUpdateDto) {}

  async delete(_id: string) {}
}
