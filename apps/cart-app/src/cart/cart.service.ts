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
  async get(_dto: CartGetDto) {}

  async addItem(_dto: CartAddItemDto) {}

  async removeItem(_dto: CartRemoveItemDto) {}

  async clear(_dto: CartClearDto) {}

  async transferToUser(_dto: CartTransferToUserDto) {}
}
