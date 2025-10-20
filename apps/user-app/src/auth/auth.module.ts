import { Module } from '@nestjs/common';
import { AuthService } from '@user-app/auth/auth.service';
import { AuthController } from '@user-app/auth/auth.controller';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
