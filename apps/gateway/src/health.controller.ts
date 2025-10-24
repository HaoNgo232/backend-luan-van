import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MicroserviceHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { Transport, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly microservice: MicroserviceHealthIndicator,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.microservice.pingCheck('nats', {
          transport: Transport.NATS,
          options: {
            servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          },
          timeout: 3000,
        }),
    ]);
  }

  @Get('ready')
  readiness(): {
    status: string;
    timestamp: string;
    uptime: number;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('live')
  liveness(): {
    status: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('services')
  async checkServices(): Promise<{
    status: string;
    services: Record<string, { status: string; latency?: number }>;
  }> {
    const [userHealth, productHealth, orderHealth] = await Promise.all([
      this.checkService(this.userService),
      this.checkService(this.productService),
      this.checkService(this.orderService),
    ]);

    return {
      status: 'ok',
      services: {
        'user-service': userHealth,
        'product-service': productHealth,
        'order-service': orderHealth,
      },
    };
  }

  private async checkService(client: ClientProxy): Promise<{ status: string; latency?: number }> {
    const startTime = Date.now();

    try {
      await firstValueFrom(
        client.send({ cmd: 'health_check' }, {}).pipe(
          timeout(2000),
          catchError(() => of({ status: 'down' })),
        ),
      );

      return {
        status: 'up',
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        status: 'down',
      };
    }
  }
}
