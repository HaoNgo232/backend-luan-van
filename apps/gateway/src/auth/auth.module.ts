import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { JwtModule } from '@shared/main';

/**
 * Auth Module
 * Cung cấp authentication endpoints và guards
 * Không cần service layer - controller gửi trực tiếp qua NATS
 */
@Module({
  imports: [JwtModule], // Import JwtModule để verify token locally
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
