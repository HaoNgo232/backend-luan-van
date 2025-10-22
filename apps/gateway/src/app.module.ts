import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@gateway/health.controller';
import { GatewayClientsModule } from '@gateway/gateway-clients.module';
import { AuthModule } from '@gateway/auth/auth.module';
import { UsersModule } from '@gateway/users/users.module';
import { AddressesModule } from '@gateway/addresses/addresses.module';
import { ProductsModule } from '@gateway/products/products.module';
import { CartModule } from '@gateway/cart/cart.module';
import { OrdersModule } from '@gateway/orders/orders.module';
import { PaymentsModule } from '@gateway/payments/payments.module';
import { ArModule } from '@gateway/ar/ar.module';
import { JwtModule } from '@shared/main';

@Module({
  imports: [
    JwtModule,
    TerminusModule,
    GatewayClientsModule, // Register all NATS clients globally
    AuthModule,
    UsersModule,
    AddressesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ArModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
