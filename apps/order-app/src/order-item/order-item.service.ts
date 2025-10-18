import { Injectable } from '@nestjs/common';
import {
  OrderItemListByOrderDto,
  OrderItemAddDto,
  OrderItemRemoveDto,
} from '../../../../libs/shared/dto/order.dto';

@Injectable()
export class OrderItemService {
  async listByOrder(_dto: OrderItemListByOrderDto) {}

  async addItem(_dto: OrderItemAddDto) {}

  async removeItem(_dto: OrderItemRemoveDto) {}
}
