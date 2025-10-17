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
  async create(dto: OrderCreateDto) {}

  async get(dto: OrderIdDto) {}

  async listByUser(dto: OrderListByUserDto) {}

  async updateStatus(dto: OrderUpdateStatusDto) {}

  async cancel(dto: OrderCancelDto) {}
}
