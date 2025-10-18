import { NestFactory } from '@nestjs/core';
import { ArAppModule } from '@ar-app/ar-app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PrismaService } from '@ar-app/prisma/prisma.service';

async function bootstrap(): Promise<void> {
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
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await app.listen();
}
void bootstrap();
