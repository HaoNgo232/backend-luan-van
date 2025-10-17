import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ProductAppModule } from './product-app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductAppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
void bootstrap();
