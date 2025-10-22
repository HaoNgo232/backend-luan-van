import { Catch, RpcExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { Response } from 'express';
import { ErrorParser } from './error-parser';
import { ErrorDetector } from './error-detector';
import { ErrorResponseBuilder } from './error-response-builder';

/**
 * Global RPC Exception Filter
 * Handles exceptions from NATS microservices and converts them to HTTP responses
 *
 * THESIS NOTE: Demonstrates Composition and Dependency Injection
 * - Uses composed components (Parser, Detector, Builder) instead of monolithic logic
 * - Each component has a single responsibility (SRP)
 * - Easy to test each component independently
 * - Easy to extend with new error handling strategies
 *
 * Supported error cases:
 * - RpcException with custom statusCode
 * - Service unavailable (empty response)
 * - Timeout errors
 * - Generic errors
 */
@Catch(RpcException)
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  private readonly errorParser: ErrorParser;
  private readonly errorDetector: ErrorDetector;
  private readonly errorResponseBuilder: ErrorResponseBuilder;

  constructor() {
    // Initialize strategy components
    this.errorParser = new ErrorParser();
    this.errorDetector = new ErrorDetector();
    this.errorResponseBuilder = new ErrorResponseBuilder();
  }

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
   * Uses strategy pattern components to process the error
   *
   * THESIS NOTE: Complexity reduced from 18 to <10 by delegating to specialized components
   */
  private handleHttpException(exception: RpcException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const rawError = exception.getError();

    // Step 1: Parse error into normalized structure
    const parsedError = this.errorParser.parse(rawError);

    // Step 2: Enhance with pattern detection (for string errors)
    const enhancedError = this.errorDetector.enhance(parsedError);

    // Step 3: Build HTTP response
    const errorResponse = this.errorResponseBuilder.buildHttpResponse(enhancedError);

    // Log for debugging
    console.error('[RpcException]', errorResponse);

    // Send response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Handle exception in RPC context (Microservices)
   * Uses same strategy components for consistency
   */
  private handleRpcException(exception: RpcException): Observable<never> {
    const rawError = exception.getError();

    // Step 1: Parse error
    const parsedError = this.errorParser.parse(rawError);

    // Step 2: Build RPC response
    const errorResponse = this.errorResponseBuilder.buildRpcResponse(parsedError);

    // Log for debugging
    console.error('[RpcException]', errorResponse);

    return throwError(() => errorResponse);
  }
}
