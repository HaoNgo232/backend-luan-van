import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { LoginDto, RefreshDto, VerifyDto } from '@shared/dto/auth.dto';
import { CreateUserDto } from '@shared/dto/user.dto';
import { EVENTS } from '@shared/events';

/**
 * Auth Service
 * Forwards authentication requests to user-app microservice via NATS
 * Includes retry mechanism and proper error handling
 */
@Injectable()
export class AuthService {
  constructor(@Inject('USER_SERVICE') private readonly userService: ClientProxy) {}

  /**
   * Forward request to user-service with retry
   */
  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.userService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({
          count: 1, // Retry 1 lần
          delay: 5000, // Sau 5 giây
        }),
        catchError(error => {
          console.error(`[Gateway] Auth request failed: ${pattern}`, error);
          throw new HttpException(
            error.message || 'Authentication service unavailable',
            error.statusCode || HttpStatus.SERVICE_UNAVAILABLE,
          );
        }),
      ),
    );
  }

  async register(dto: CreateUserDto) {
    return this.sendWithRetry(EVENTS.AUTH.REGISTER, dto);
  }

  async login(dto: LoginDto) {
    return this.sendWithRetry(EVENTS.AUTH.LOGIN, dto);
  }

  async refresh(dto: RefreshDto) {
    return this.sendWithRetry(EVENTS.AUTH.REFRESH, dto);
  }

  async getCurrentUser(userId: string) {
    return this.sendWithRetry(EVENTS.USER.FIND_BY_ID, userId);
  }

  async verify(dto: VerifyDto) {
    return this.sendWithRetry(EVENTS.AUTH.VERIFY, dto);
  }
}
