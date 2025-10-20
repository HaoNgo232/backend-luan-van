import { Module } from '@nestjs/common';
import { UsersService } from '@user-app/users/users.service';
import { UsersController } from '@user-app/users/users.controller';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
