import { Module } from '@nestjs/common';
import { AddressService } from '@user-app/address/address.service';
import { AddressController } from '@user-app/address/address.controller';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Module({
  controllers: [AddressController],
  providers: [AddressService, PrismaService],
  exports: [AddressService],
})
export class AddressModule {}
