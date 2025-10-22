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
 * Supported error cases:
 * - RpcException with custom statusCode
 * - Service unavailable (empty response)
 * - Timeout errors
 * - Generic errors
 */
@Catch(RpcException)
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
  private handleHttpException(exception: RpcException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const rawError = exception.getError();

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
  private handleRpcException(exception: RpcException): Observable<never> {
    const rawError = exception.getError();

    // Extract error information
    const statusCode = ErrorParser.extractStatusCode(rawError);
    const message = ErrorParser.extractMessage(rawError);

    // Build RPC response
    const errorResponse = ErrorResponseBuilder.buildRpcResponse(statusCode, message);

    console.error('[RpcException]', errorResponse);
    return throwError(() => errorResponse);
  }
}
