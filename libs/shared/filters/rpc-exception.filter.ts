import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { Response } from 'express';

/**
 * Global RPC Exception Filter
 * Handles exceptions from NATS microservices and converts them to HTTP responses
 *
 * Supported error cases:
 * - RpcException with custom statusCode
 * - Service unavailable (empty response)
 * - Timeout errors
 * - Generic errors
 */
@Catch(RpcException)
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> | void {
    const ctx = host.getContext<string>();

    // Handle HTTP context (Gateway)
    if (ctx === 'http') {
      return this.handleHttpException(exception, host);
    }

    // Handle RPC context (Microservices)
    return this.handleRpcException(exception);
  }

  /**
   * Handle exception in HTTP context (Gateway)
   */
  private handleHttpException(exception: RpcException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = exception.getError();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = null;

    // Handle structured error object
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;

      if ('statusCode' in errorObj && typeof errorObj.statusCode === 'number') {
        statusCode = errorObj.statusCode;
      }

      if ('message' in errorObj) {
        message = String(errorObj.message);
      }

      if ('error' in errorObj) {
        details = errorObj.error;
      }
    } else if (typeof error === 'string') {
      message = error;

      // Detect specific error patterns
      if (error.toLowerCase().includes('empty response')) {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service temporarily unavailable';
      } else if (error.toLowerCase().includes('timeout')) {
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        message = 'Request timeout - service did not respond in time';
      } else if (error.toLowerCase().includes('not found')) {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (error.toLowerCase().includes('unauthorized')) {
        statusCode = HttpStatus.UNAUTHORIZED;
      } else if (error.toLowerCase().includes('forbidden')) {
        statusCode = HttpStatus.FORBIDDEN;
      }
    }

    const errorResponse: {
      statusCode: number;
      message: string;
      error?: string;
      details?: unknown;
      timestamp: string;
    } = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      errorResponse.details = details;
    }

    if (statusCode >= 500) {
      errorResponse.error = 'Internal Server Error';
    }

    console.error('[RpcException]', errorResponse);

    response.status(statusCode).json(errorResponse);
  }

  /**
   * Handle exception in RPC context (Microservices)
   */
  private handleRpcException(exception: RpcException): Observable<never> {
    const error = exception.getError();

    const errorResponse = {
      statusCode:
        typeof error === 'object' && error !== null && 'statusCode' in error
          ? (error as { statusCode: number }).statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        typeof error === 'string'
          ? error
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Internal server error',
      timestamp: new Date().toISOString(),
    };

    console.error('[RpcException]', errorResponse);

    return throwError(() => errorResponse);
  }
}
