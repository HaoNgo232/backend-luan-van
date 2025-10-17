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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getById(_dto: ProductIdDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBySlug(_dto: ProductSlugDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_query: ProductListQueryDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_dto: ProductCreateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_id: string, _dto: ProductUpdateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_id: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async incrementStock(_dto: StockChangeDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async decrementStock(_dto: StockChangeDto) {}
}
