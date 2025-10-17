import { NestFactory } from '@nestjs/core';
import { ArAppModule } from './ar-app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ArAppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
void bootstrap();
