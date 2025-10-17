import { Module } from '@nestjs/common';
import { ArModule } from './ar/ar.module';

@Module({
  imports: [ArModule],
  controllers: [],
  providers: [],
})
export class ArAppModule {}
