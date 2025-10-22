import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

/**
 * GatewayClientsModule
 *
 * Registers NATS client proxies used by the gateway to communicate with
 * downstream microservices. Marked as @Global so feature modules can inject
 * the proxies without repeating configuration.
 */
@Global()
@Module({
  imports: [
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
  exports: [ClientsModule],
})
export class GatewayClientsModule {}
