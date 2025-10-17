import { Injectable } from '@nestjs/common';
import {
  OrderItemListByOrderDto,
  OrderItemAddDto,
  OrderItemRemoveDto,
} from '../../../../libs/shared/dto/order.dto';

@Injectable()
export class OrderItemService {
  async listByOrder(dto: OrderItemListByOrderDto) {}

  async addItem(dto: OrderItemAddDto) {}

  async removeItem(dto: OrderItemRemoveDto) {}
}
