import { Module } from '@nestjs/common';
import { UsersService } from '@user-app/users/users.service';
import { UsersController } from '@user-app/users/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
