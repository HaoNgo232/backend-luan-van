import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AddressModule } from './address/address.module';

@Module({
  imports: [UsersModule, AuthModule, AddressModule],
  controllers: [],
  providers: [],
})
export class UserAppModule {}
