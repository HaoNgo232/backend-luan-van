import { NestFactory } from '@nestjs/core';
import { UsersAppModule } from './users-app.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersAppModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
