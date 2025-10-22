import { HttpStatus } from '@nestjs/common';

/**
 * Error Parser Utility
 * Extracts structured information from RpcException errors
 */
export class ErrorParser {
  /**
   * Parse error to extract statusCode, message, and details
   */
  static parse(error: string | object): {
    statusCode: number;
    message: string;
    details: unknown;
  } {
    if (typeof error === 'object' && error !== null) {
      return this.parseObjectError(error);
    }

    if (typeof error === 'string') {
      return this.parseStringError(error);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: null,
    };
  }

  /**
   * Parse structured error object
   */
  private static parseObjectError(error: object): {
    statusCode: number;
    message: string;
    details: unknown;
  } {
    const errorObj = error as Record<string, unknown>;

    const statusCode =
      'statusCode' in errorObj && typeof errorObj.statusCode === 'number'
        ? errorObj.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 'message' in errorObj ? String(errorObj.message) : 'Internal server error';

    const details = 'error' in errorObj ? errorObj.error : null;

    return { statusCode, message, details };
  }

  /**
   * Parse string error
   */
  private static parseStringError(error: string): {
    statusCode: number;
    message: string;
    details: unknown;
  } {
    const lowerError = error.toLowerCase();

    // Detect error type from message
    if (lowerError.includes('empty response')) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
        details: null,
      };
    }

    if (lowerError.includes('timeout')) {
      return {
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout - service did not respond in time',
        details: null,
      };
    }

    if (lowerError.includes('not found')) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: error,
        details: null,
      };
    }

    if (lowerError.includes('unauthorized')) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error,
        details: null,
      };
    }

    if (lowerError.includes('forbidden')) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: error,
        details: null,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error,
      details: null,
    };
  }

  /**
   * Extract message from error for RPC context
   */
  static extractMessage(error: string | object): string {
    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'Internal server error';
  }

  /**
   * Extract status code from error for RPC context
   */
  static extractStatusCode(error: string | object): number {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      return (error as { statusCode: number }).statusCode;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
