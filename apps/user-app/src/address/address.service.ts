import { Injectable } from '@nestjs/common';
import {
  AddressCreateDto,
  AddressUpdateDto,
  AddressListByUserDto,
} from '@shared/dto/address.dto';

@Injectable()
export class AddressService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listByUser(_dto: AddressListByUserDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_dto: AddressCreateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_id: string, _dto: AddressUpdateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_id: string) {}
}
