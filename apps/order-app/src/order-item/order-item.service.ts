import { Injectable } from '@nestjs/common';
import {
  OrderItemListByOrderDto,
  OrderItemAddDto,
  OrderItemRemoveDto,
} from '../../../../libs/shared/dto/order.dto';

@Injectable()
export class OrderItemService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listByOrder(_dto: OrderItemListByOrderDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addItem(_dto: OrderItemAddDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeItem(_dto: OrderItemRemoveDto) {}
}
