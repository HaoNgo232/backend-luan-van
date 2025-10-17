import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddressService } from './address.service';
import { EVENTS } from '../../../../libs/shared/events';
import {
  AddressCreateDto,
  AddressUpdateDto,
  AddressListByUserDto,
} from '../../../../libs/shared/dto/address.dto';

@Controller()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @MessagePattern(EVENTS.ADDRESS.LIST_BY_USER)
  listByUser(@Payload() dto: AddressListByUserDto) {
    return this.addressService.listByUser(dto);
  }

  @MessagePattern(EVENTS.ADDRESS.CREATE)
  create(@Payload() dto: AddressCreateDto) {
    return this.addressService.create(dto);
  }

  @MessagePattern(EVENTS.ADDRESS.UPDATE)
  update(@Payload() payload: { id: string; dto: AddressUpdateDto }) {
    return this.addressService.update(payload.id, payload.dto);
  }

  @MessagePattern(EVENTS.ADDRESS.DELETE)
  delete(@Payload() id: string) {
    return this.addressService.delete(id);
  }
}
