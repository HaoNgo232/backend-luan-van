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
  async getById(_dto: ProductIdDto) {}

  async getBySlug(_dto: ProductSlugDto) {}

  async list(_query: ProductListQueryDto) {}

  async create(_dto: ProductCreateDto) {}

  async update(_id: string, _dto: ProductUpdateDto) {}

  async delete(_id: string) {}

  async incrementStock(_dto: StockChangeDto) {}

  async decrementStock(_dto: StockChangeDto) {}
}
