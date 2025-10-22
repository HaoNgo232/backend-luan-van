import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

export abstract class BaseGatewayController {
  constructor(protected readonly service: ClientProxy) {}

  protected async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.service.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({ count: 1, delay: 1000 }),
        catchError((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : 'Service communication failed';
          const statusCode =
            error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
          throw new HttpException(errorMessage, statusCode);
        }),
      ),
    );
  }
}
