import { Injectable } from '@nestjs/common';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryIdDto,
  CategorySlugDto,
  CategoryListQueryDto,
} from '../../../../libs/shared/dto/category.dto';

@Injectable()
export class CategoriesService {
  async getById(dto: CategoryIdDto) {}

  async getBySlug(dto: CategorySlugDto) {}

  async list(query: CategoryListQueryDto) {}

  async create(dto: CategoryCreateDto) {}

  async update(id: string, dto: CategoryUpdateDto) {}

  async delete(id: string) {}
}
