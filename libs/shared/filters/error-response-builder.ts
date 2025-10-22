import { HttpStatus } from '@nestjs/common';
import { ParsedError } from './error-parser';

/**
 * Error Response Structure
 * Standard format for all error responses
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
  timestamp: string;
}

/**
 * ErrorResponseBuilder
 * Responsibility: Build consistent error response objects
 *
 * THESIS NOTE: Demonstrates Builder Pattern
 * - Constructs complex ErrorResponse objects step by step
 * - Ensures consistent structure across all error responses
 */
export class ErrorResponseBuilder {
  /**
   * Build HTTP error response for Gateway
   */
  buildHttpResponse(parsedError: ParsedError): ErrorResponse {
    const response: ErrorResponse = {
      statusCode: parsedError.statusCode,
      message: parsedError.message,
      timestamp: new Date().toISOString(),
    };

    // Add details if available
    if (parsedError.details) {
      response.details = parsedError.details;
    }

    // Add generic error label for 5xx errors
    if (this.isServerError(parsedError.statusCode)) {
      response.error = 'Internal Server Error';
    }

    return response;
  }

  /**
   * Build RPC error response for Microservices
   */
  buildRpcResponse(parsedError: ParsedError): ErrorResponse {
    return {
      statusCode: parsedError.statusCode,
      message: parsedError.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if status code is a server error (5xx)
   */
  private isServerError(statusCode: number): boolean {
    return statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
