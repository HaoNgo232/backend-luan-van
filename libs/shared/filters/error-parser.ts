import { HttpStatus } from '@nestjs/common';

/**
 * Parsed Error Structure
 * Represents a normalized error object extracted from RpcException
 */
export interface ParsedError {
  statusCode: number;
  message: string;
  details?: unknown;
}

/**
 * ErrorParser
 * Responsibility: Extract and normalize error data from RpcException
 *
 * THESIS NOTE: Demonstrates Single Responsibility Principle (SRP)
 * - This class has ONE job: parse errors
 * - No HTTP logic, no detection logic, no building logic
 */
export class ErrorParser {
  /**
   * Parse error from RpcException
   * Handles both object and string error formats
   */
  parse(error: string | object): ParsedError {
    if (typeof error === 'object' && error !== null) {
      return this.parseObjectError(error as Record<string, unknown>);
    }

    if (typeof error === 'string') {
      return this.parseStringError(error);
    }

    return this.getDefaultError();
  }

  /**
   * Parse structured error object
   */
  private parseObjectError(error: Record<string, unknown>): ParsedError {
    const parsed: ParsedError = {
      statusCode: this.extractStatusCode(error),
      message: this.extractMessage(error),
    };

    if ('error' in error) {
      parsed.details = error.error;
    }

    return parsed;
  }

  /**
   * Parse string error (will be enhanced by ErrorDetector)
   */
  private parseStringError(error: string): ParsedError {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error,
    };
  }

  /**
   * Extract status code from error object
   */
  private extractStatusCode(error: Record<string, unknown>): number {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extract message from error object
   * Uses explicit if-else instead of nested ternary (SonarQube compliance)
   */
  private extractMessage(error: Record<string, unknown>): string {
    if ('message' in error) {
      return String(error.message);
    }
    return 'Internal server error';
  }

  /**
   * Default error for invalid input
   */
  private getDefaultError(): ParsedError {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
