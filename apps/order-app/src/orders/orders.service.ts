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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_dto: OrderCreateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_dto: OrderIdDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listByUser(_dto: OrderListByUserDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateStatus(_dto: OrderUpdateStatusDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancel(_dto: OrderCancelDto) {}
}
