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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getById(_dto: CategoryIdDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBySlug(_dto: CategorySlugDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_query: CategoryListQueryDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_dto: CategoryCreateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_id: string, _dto: CategoryUpdateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_id: string) {}
}
