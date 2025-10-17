import { NestFactory } from '@nestjs/core';
import { CartAppModule } from './cart-app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CartAppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
void bootstrap();
