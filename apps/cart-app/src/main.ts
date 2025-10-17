import { NestFactory } from '@nestjs/core';
import { CartAppModule } from './cart-app.module';

async function bootstrap() {
  const app = await NestFactory.create(CartAppModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
