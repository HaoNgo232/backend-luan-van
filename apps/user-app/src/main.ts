import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserAppModule } from '@user-app/user-app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllRpcExceptionsFilter } from '@shared/filters/rpc-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserAppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'user-app',
      },
    },
  );

  // Global validation for all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global RPC exception handling
  app.useGlobalFilters(new AllRpcExceptionsFilter());

  await app.listen();
  console.log('✅ [User Service] is listening on NATS');
}
void bootstrap();
