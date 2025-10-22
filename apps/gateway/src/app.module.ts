import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@gateway/health.controller';

@Module({
  imports: [
    TerminusModule,
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'user-app',
        },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'product-app',
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'order-app',
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'payment-app',
        },
      },
      {
        name: 'CART_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'cart-app',
        },
      },
      {
        name: 'REPORT_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'report-app',
        },
      },
      {
        name: 'AR_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'ar-app',
        },
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
