import { NestFactory } from '@nestjs/core';
import { UserAppModule } from './user-app.module';

async function bootstrap() {
  const app = await NestFactory.create(UserAppModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
