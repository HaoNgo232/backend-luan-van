import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { JwtModule } from '@shared/main';
import { UsersModule } from '@user-app/users/users.module';
import { AuthModule } from '@user-app/auth/auth.module';
import { AddressModule } from '@user-app/address/address.module';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, TerminusModule, UsersModule, AuthModule, AddressModule],
  controllers: [],
  providers: [PrismaService],
})
export class UserAppModule {}
