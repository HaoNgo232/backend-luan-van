import { NestFactory } from '@nestjs/core';
import { CartAppModule } from '@cart-app/cart-app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CartAppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'cart-app',
      },
    },
  );
  await app.listen();
}
void bootstrap();
