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
  async get(dto: CartGetDto) {}

  async addItem(dto: CartAddItemDto) {}

  async removeItem(dto: CartRemoveItemDto) {}

  async clear(dto: CartClearDto) {}

  async transferToUser(dto: CartTransferToUserDto) {}
}
