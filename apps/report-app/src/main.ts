import { NestFactory } from '@nestjs/core';
import { ReportAppModule } from './report-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ReportAppModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
