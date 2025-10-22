import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { OrdersModule } from '@order-app/orders/orders.module';
import { OrderItemModule } from '@order-app/order-item/order-item.module';
import { PrismaService } from '@order-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, OrdersModule, OrderItemModule],
  controllers: [],
  providers: [PrismaService],
})
export class OrderAppModule {}
