import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { EVENTS } from '../../../../libs/shared/events';
import {
  ProductCreateDto,
  ProductUpdateDto,
  ProductListQueryDto,
  ProductIdDto,
  ProductSlugDto,
  StockChangeDto,
} from '../../../../libs/shared/dto/product.dto';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(EVENTS.PRODUCT.GET_BY_ID)
  getById(@Payload() dto: ProductIdDto) {
    return this.productsService.getById(dto);
  }

  @MessagePattern(EVENTS.PRODUCT.GET_BY_SLUG)
  getBySlug(@Payload() dto: ProductSlugDto) {
    return this.productsService.getBySlug(dto);
  }

  @MessagePattern(EVENTS.PRODUCT.LIST)
  list(@Payload() query: ProductListQueryDto) {
    return this.productsService.list(query);
  }

  @MessagePattern(EVENTS.PRODUCT.CREATE)
  create(@Payload() dto: ProductCreateDto) {
    return this.productsService.create(dto);
  }

  @MessagePattern(EVENTS.PRODUCT.UPDATE)
  update(@Payload() payload: { id: string; dto: ProductUpdateDto }) {
    return this.productsService.update(payload.id, payload.dto);
  }

  @MessagePattern(EVENTS.PRODUCT.DELETE)
  delete(@Payload() id: string) {
    return this.productsService.delete(id);
  }

  @MessagePattern(EVENTS.PRODUCT.INC_STOCK)
  incrementStock(@Payload() dto: StockChangeDto) {
    return this.productsService.incrementStock(dto);
  }

  @MessagePattern(EVENTS.PRODUCT.DEC_STOCK)
  decrementStock(@Payload() dto: StockChangeDto) {
    return this.productsService.decrementStock(dto);
  }
}
