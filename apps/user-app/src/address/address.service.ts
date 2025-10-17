import { Injectable } from '@nestjs/common';
import {
  AddressCreateDto,
  AddressUpdateDto,
  AddressListByUserDto,
} from '@shared/dto/address.dto';

@Injectable()
export class AddressService {
  async listByUser(dto: AddressListByUserDto) {}

  async create(dto: AddressCreateDto) {}

  async update(id: string, dto: AddressUpdateDto) {}

  async delete(id: string) {}
}
