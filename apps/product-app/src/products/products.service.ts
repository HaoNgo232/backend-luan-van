import { Injectable } from '@nestjs/common';
import {
  ProductCreateDto,
  ProductUpdateDto,
  ProductListQueryDto,
  ProductIdDto,
  ProductSlugDto,
  StockChangeDto,
} from '@shared/dto/product.dto';

@Injectable()
export class ProductsService {
  async getById(dto: ProductIdDto) {}

  async getBySlug(dto: ProductSlugDto) {}

  async list(query: ProductListQueryDto) {}

  async create(dto: ProductCreateDto) {}

  async update(id: string, dto: ProductUpdateDto) {}

  async delete(id: string) {}

  async incrementStock(dto: StockChangeDto) {}

  async decrementStock(dto: StockChangeDto) {}
}
