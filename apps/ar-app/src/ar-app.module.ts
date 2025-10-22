import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { ArModule } from '@ar-app/ar/ar.module';
import { PrismaService } from '@ar-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, ArModule],
  controllers: [],
  providers: [PrismaService],
})
export class ArAppModule {}
