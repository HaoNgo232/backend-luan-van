import { Injectable } from '@nestjs/common';
import {
  CartGetDto,
  CartAddItemDto,
  CartRemoveItemDto,
  CartClearDto,
  CartTransferToUserDto,
} from '@shared/dto/cart.dto';

@Injectable()
export class CartService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_dto: CartGetDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addItem(_dto: CartAddItemDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeItem(_dto: CartRemoveItemDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clear(_dto: CartClearDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transferToUser(_dto: CartTransferToUserDto) {}
}
