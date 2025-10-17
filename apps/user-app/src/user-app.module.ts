import { Module } from '@nestjs/common';
import { UsersModule } from '@user-app/users/users.module';
import { AuthModule } from '@user-app/auth/auth.module';
import { AddressModule } from '@user-app/address/address.module';

@Module({
  imports: [UsersModule, AuthModule, AddressModule],
  controllers: [],
  providers: [],
})
export class UserAppModule {}
