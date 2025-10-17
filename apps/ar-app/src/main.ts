import { NestFactory } from '@nestjs/core';
import { ArAppModule } from './ar-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ArAppModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
