import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoriesService } from '@product-app/categories/categories.service';
import { EVENTS } from '@shared/events';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryIdDto,
  CategorySlugDto,
  CategoryListQueryDto,
} from '@shared/dto/category.dto';

export interface ICategoriesController {
  getById(dto: CategoryIdDto): Promise<any>;
  getBySlug(dto: CategorySlugDto): Promise<any>;
  list(query: CategoryListQueryDto): Promise<any>;
  create(dto: CategoryCreateDto): Promise<any>;
  update(payload: { id: string; dto: CategoryUpdateDto }): Promise<any>;
  delete(id: string): Promise<any>;
}

@Controller()
export class CategoriesController implements ICategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @MessagePattern(EVENTS.CATEGORY.GET_BY_ID)
  getById(@Payload() dto: CategoryIdDto) {
    return this.categoriesService.getById(dto);
  }

  @MessagePattern(EVENTS.CATEGORY.GET_BY_SLUG)
  getBySlug(@Payload() dto: CategorySlugDto) {
    return this.categoriesService.getBySlug(dto);
  }

  @MessagePattern(EVENTS.CATEGORY.LIST)
  list(@Payload() query: CategoryListQueryDto) {
    return this.categoriesService.list(query);
  }

  @MessagePattern(EVENTS.CATEGORY.CREATE)
  create(@Payload() dto: CategoryCreateDto) {
    return this.categoriesService.create(dto);
  }

  @MessagePattern(EVENTS.CATEGORY.UPDATE)
  update(@Payload() payload: { id: string; dto: CategoryUpdateDto }) {
    return this.categoriesService.update(payload.id, payload.dto);
  }

  @MessagePattern(EVENTS.CATEGORY.DELETE)
  delete(@Payload() id: string) {
    return this.categoriesService.delete(id);
  }
}
