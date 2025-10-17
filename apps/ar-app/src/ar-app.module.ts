import { Module } from '@nestjs/common';
import { ArModule } from '@ar-app/ar/ar.module';

@Module({
  imports: [ArModule],
  controllers: [],
  providers: [],
})
export class ArAppModule {}
