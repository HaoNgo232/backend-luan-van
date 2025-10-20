import { Module } from '@nestjs/common';
import { ArService } from '@ar-app/ar/ar.service';
import { ArController } from '@ar-app/ar/ar.controller';
import { PrismaService } from '@ar-app/prisma/prisma.service';

@Module({
  controllers: [ArController],
  providers: [ArService, PrismaService],
  exports: [ArService],
})
export class ArModule {}
