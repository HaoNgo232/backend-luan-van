import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { EVENTS } from '../../../../libs/shared/events';
import {
  CartGetDto,
  CartAddItemDto,
  CartRemoveItemDto,
  CartClearDto,
  CartTransferToUserDto,
} from '../../../../libs/shared/dto/cart.dto';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern(EVENTS.CART.GET)
  get(@Payload() dto: CartGetDto) {
    return this.cartService.get(dto);
  }

  @MessagePattern(EVENTS.CART.ADD_ITEM)
  addItem(@Payload() dto: CartAddItemDto) {
    return this.cartService.addItem(dto);
  }

  @MessagePattern(EVENTS.CART.REMOVE_ITEM)
  removeItem(@Payload() dto: CartRemoveItemDto) {
    return this.cartService.removeItem(dto);
  }

  @MessagePattern(EVENTS.CART.CLEAR)
  clear(@Payload() dto: CartClearDto) {
    return this.cartService.clear(dto);
  }

  @MessagePattern(EVENTS.CART.TRANSFER_TO_USER)
  transferToUser(@Payload() dto: CartTransferToUserDto) {
    return this.cartService.transferToUser(dto);
  }
}
