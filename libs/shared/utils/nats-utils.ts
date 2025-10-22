// In libs/shared/utils/nats-utils.ts (new file)
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Error } from '@shared/main';

export async function sendWithRetry<T>(
  client: ClientProxy,
  pattern: string,
  data: unknown,
): Promise<T> {
  return firstValueFrom(
    client.send<T>(pattern, data).pipe(
      timeout(5000),
      retry({ count: 1, delay: 1000 }),
      catchError((error: Error) => {
        throw new HttpException(
          error.message || 'Service communication failed',
          error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    ),
  );
}
