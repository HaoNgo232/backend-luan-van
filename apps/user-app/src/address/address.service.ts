import { Injectable } from '@nestjs/common';
import {
  AddressCreateDto,
  AddressUpdateDto,
  AddressListByUserDto,
} from '@shared/dto/address.dto';

@Injectable()
export class AddressService {
  async listByUser(_dto: AddressListByUserDto) {}

  async create(_dto: AddressCreateDto) {}

  async update(_id: string, _dto: AddressUpdateDto) {}

  async delete(_id: string) {}
}
