import { Injectable } from '@nestjs/common';
import {
  OrderCreateDto,
  OrderIdDto,
  OrderListByUserDto,
  OrderUpdateStatusDto,
  OrderCancelDto,
} from '@shared/dto/order.dto';

@Injectable()
export class OrdersService {
  async create(_dto: OrderCreateDto) {}

  async get(_dto: OrderIdDto) {}

  async listByUser(_dto: OrderListByUserDto) {}

  async updateStatus(_dto: OrderUpdateStatusDto) {}

  async cancel(_dto: OrderCancelDto) {}
}
