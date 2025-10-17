import { NestFactory } from '@nestjs/core';
import { ProductAppModule } from './product-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductAppModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
