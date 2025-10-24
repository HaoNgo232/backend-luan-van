import { Catch, RpcExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { Response } from 'express';
import { ErrorParser } from './error-parser';
import { ErrorResponseBuilder } from './error-response-builder';

/**
 * Global RPC Exception Filter
 * Handles exceptions from NATS microservices and converts them to HTTP responses
 *
 * REFACTORED: Reduced Cognitive Complexity from 18 to <10
 * - Extracted error parsing logic to ErrorParser
 * - Extracted response building logic to ErrorResponseBuilder
 * - Each method now has a single clear purpose (SRP)
 * - Easier to test and maintain
 *
 * ✅ UPDATED: Now catches ALL exceptions (RpcException + HttpException)
 * - Microservices can throw standard NestJS exceptions (NotFoundException, etc.)
 * - Filter automatically converts them to RPC format
 * - No need to manually wrap in RpcException
 *
 * Supported error cases:
 * - RpcException with custom statusCode
 * - HttpException (NotFoundException, BadRequestException, etc.)
 * - Service unavailable (empty response)
 * - Timeout errors
 * - Generic errors
 */
@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const contextType = host.getType();

    // Handle HTTP context (Gateway)
    if (contextType === 'http') {
      this.handleHttpException(exception, host);
      // Return Observable to satisfy interface contract
      return throwError(() => ({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Exception handled',
      }));
    }

    // Handle RPC context (Microservices)
    return this.handleRpcException(exception);
  }

  /**
   * Handle exception in HTTP context (Gateway)
   * Complexity reduced by delegating to helper utilities
   */
  private handleHttpException(exception: RpcException | Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    // Convert standard NestJS exceptions to RPC format
    const rawError = this.normalizeException(exception);

    // Parse error into structured format
    const { statusCode, message, details } = ErrorParser.parse(rawError);

    // Build and send HTTP response
    const errorResponse = ErrorResponseBuilder.buildHttpResponse(statusCode, message, details);

    console.error('[RpcException]', errorResponse);
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Handle exception in RPC context (Microservices)
   */
  private handleRpcException(exception: RpcException | Error): Observable<never> {
    // Convert standard NestJS exceptions to RPC format
    const rawError = this.normalizeException(exception);

    // Extract error information
    const statusCode = ErrorParser.extractStatusCode(rawError);
    const message = ErrorParser.extractMessage(rawError);

    // Build RPC response
    const errorResponse = ErrorResponseBuilder.buildRpcResponse(statusCode, message);

    console.error('[RpcException]', errorResponse);
    return throwError(() => errorResponse);
  }

  /**
   * Normalize exception to RPC format
   * Converts HttpException (NotFoundException, BadRequestException) to RPC-compatible format
   */
  private normalizeException(exception: RpcException | Error): string | object {
    // If already RpcException, return as-is
    if (exception instanceof RpcException) {
      return exception.getError();
    }

    // Convert standard Error to structured format
    if (exception instanceof Error) {
      // Check if it's a NestJS HttpException by duck-typing
      const httpException = exception as {
        getStatus?: () => number;
        getResponse?: () => string | object;
        message: string;
      };

      if (typeof httpException.getStatus === 'function') {
        const statusCode = httpException.getStatus();
        const response = httpException.getResponse?.() || exception.message;

        return {
          statusCode,
          message:
            typeof response === 'string'
              ? response
              : (response as { message: string }).message || exception.message,
        };
      }

      // Generic error
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
      };
    }

    // Unknown exception type
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
