/**
 * Error Response Builder
 * Constructs standardized error response objects
 */
export class ErrorResponseBuilder {
  /**
   * Build HTTP error response
   */
  static buildHttpResponse(
    statusCode: number,
    message: string,
    details: unknown,
  ): {
    statusCode: number;
    message: string;
    error?: string;
    details?: unknown;
    timestamp: string;
  } {
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

    return errorResponse;
  }

  /**
   * Build RPC error response
   */
  static buildRpcResponse(
    statusCode: number,
    message: string,
  ): {
    statusCode: number;
    message: string;
    timestamp: string;
  } {
    return {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
