import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry, catchError, throwError } from 'rxjs';

/**
 * Options cho send method
 */
export interface SendOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * BaseGatewayController
 * Cung cấp unified communication layer với NATS cho tất cả controllers
 *
 * Pattern: Template Method - định nghĩa skeleton của NATS communication
 *
 * @example
 * class UsersController extends BaseGatewayController {
 *   constructor(@Inject('USER_SERVICE') client: ClientProxy) {
 *     super(client);
 *   }
 *
 *   async findById(id: string): Promise<UserResponse> {
 *     return this.send(EVENTS.USER.FIND_BY_ID, id);
 *   }
 * }
 */
@Injectable()
export abstract class BaseGatewayController {
  constructor(protected readonly client: ClientProxy) {}

  /**
   * Gửi request-response message đến microservice qua NATS
   *
   * @param pattern - NATS event pattern
   * @param data - Request payload
   * @param options - Timeout và retry configuration
   * @returns Promise với typed response
   *
   * @throws HttpException với status code tương ứng nếu có lỗi
   */
  protected async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
    options: SendOptions = {},
  ): Promise<TResponse> {
    const { timeout: timeoutMs = 5000, retryCount = 1, retryDelay = 1000 } = options;

    return firstValueFrom(
      this.client.send<TResponse, TRequest>(pattern, data).pipe(
        timeout(timeoutMs),
        retry({ count: retryCount, delay: retryDelay }),
        catchError((error: unknown) => throwError(() => this.createHttpError(error, pattern))),
      ),
    );
  }

  /**
   * Gửi event (fire-and-forget) đến microservice qua NATS
   * Không chờ response, phù hợp cho logging, notifications
   *
   * @param pattern - NATS event pattern
   * @param data - Event payload
   */
  protected emit<TEvent>(pattern: string, data: TEvent): void {
    this.client.emit<void, TEvent>(pattern, data);
  }

  /**
   * Centralized error handling cho NATS communication
   * Parse error từ microservice và convert thành HTTP exception
   */
  private createHttpError(error: unknown, pattern: string): HttpException {
    console.error(`[Gateway] Error calling ${pattern}:`, error);

    // Timeout error - check name property first
    if (this.isTimeoutError(error)) {
      return new HttpException('Service request timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    // Parse error từ microservice (RPC error)
    if (this.isRpcError(error)) {
      return new HttpException(
        error.message || 'Service communication failed',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Generic error
    return new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * Type guard để check timeout error
   */
  private isTimeoutError(error: unknown): boolean {
    return (
      (error instanceof Error && error.name === 'TimeoutError') ||
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'TimeoutError')
    );
  }

  /**
   * Type guard để check RPC error format
   */
  private isRpcError(error: unknown): error is { message: string; statusCode: number } {
    return (
      typeof error === 'object' && error !== null && 'message' in error && 'statusCode' in error
    );
  }
}
