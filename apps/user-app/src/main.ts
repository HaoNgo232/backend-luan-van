import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserAppModule } from './user-app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserAppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
void bootstrap();
