import { Module } from '@nestjs/common';
import { UsersAppController } from './users-app.controller';
import { UsersAppService } from './users-app.service';

@Module({
  imports: [],
  controllers: [UsersAppController],
  providers: [UsersAppService],
})
export class UsersAppModule {}
