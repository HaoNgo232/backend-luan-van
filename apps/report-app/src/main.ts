import { ReportAppModule } from '@report-app/report-app.module';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReportAppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'report-app',
      },
    },
  );
  await app.listen();
  console.log(' [Report Service] is listening on NATS');
}
void bootstrap();
