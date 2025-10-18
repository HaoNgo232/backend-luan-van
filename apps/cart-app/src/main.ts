import { NestFactory } from '@nestjs/core';
import { CartAppModule } from '@cart-app/cart-app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { PrismaService } from '@cart-app/prisma/prisma.service';

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
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await app.listen();
}
void bootstrap();
