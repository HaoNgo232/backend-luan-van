import { Module } from '@nestjs/common';
import { UsersModule } from '@user-app/users/users.module';
import { AuthModule } from '@user-app/auth/auth.module';
import { AddressModule } from '@user-app/address/address.module';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Module({
  imports: [UsersModule, AuthModule, AddressModule],
  controllers: [],
  providers: [PrismaService],
})
export class UserAppModule {}
