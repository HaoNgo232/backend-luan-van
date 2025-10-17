import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { PaymentAppModule } from './payment-app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentAppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
void bootstrap();
