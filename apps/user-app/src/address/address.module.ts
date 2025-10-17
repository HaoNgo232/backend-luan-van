import { Module } from '@nestjs/common';
import { AddressService } from '@user-app/address/address.service';
import { AddressController } from '@user-app/address/address.controller';

@Module({
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
