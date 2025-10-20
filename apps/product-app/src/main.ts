import { NestFactory } from '@nestjs/core';
import { ProductAppModule } from '@product-app/product-app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductAppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'product-app',
      },
    },
  );
  await app.listen();
}
void bootstrap();
