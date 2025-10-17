import { NestFactory } from '@nestjs/core';
import { ArAppModule } from '@ar-app/ar-app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ArAppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'ar-app',
      },
    },
  );
  await app.listen();
}
void bootstrap();
