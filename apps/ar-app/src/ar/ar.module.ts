import { Module } from '@nestjs/common';
import { ArService } from '@ar-app/ar/ar.service';
import { ArController } from '@ar-app/ar/ar.controller';

@Module({
  controllers: [ArController],
  providers: [ArService],
})
export class ArModule {}
