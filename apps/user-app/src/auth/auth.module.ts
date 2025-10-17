import { Module } from '@nestjs/common';
import { AuthService } from '@user-app/auth/auth.service';
import { AuthController } from '@user-app/auth/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
