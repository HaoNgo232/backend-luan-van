import { HttpStatus } from '@nestjs/common';
import { ParsedError } from './error-parser';

/**
 * Error Detection Rule
 * Maps keywords to HTTP status codes
 */
interface ErrorPattern {
  keywords: string[];
  statusCode: number;
  message?: string;
}

/**
 * ErrorDetector
 * Responsibility: Detect error types based on message patterns
 *
 * THESIS NOTE: Demonstrates Strategy Pattern
 * - Each error pattern is a strategy
 * - Easy to add new patterns without modifying existing code (Open/Closed Principle)
 */
export class ErrorDetector {
  /**
   * Predefined error patterns
   * Can be extended without modifying detector logic
   */
  private readonly patterns: ErrorPattern[] = [
    {
      keywords: ['empty response'],
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Service temporarily unavailable',
    },
    {
      keywords: ['timeout'],
      statusCode: HttpStatus.REQUEST_TIMEOUT,
      message: 'Request timeout - service did not respond in time',
    },
    {
      keywords: ['not found'],
      statusCode: HttpStatus.NOT_FOUND,
    },
    {
      keywords: ['unauthorized'],
      statusCode: HttpStatus.UNAUTHORIZED,
    },
    {
      keywords: ['forbidden'],
      statusCode: HttpStatus.FORBIDDEN,
    },
    {
      keywords: ['bad request'],
      statusCode: HttpStatus.BAD_REQUEST,
    },
    {
      keywords: ['conflict'],
      statusCode: HttpStatus.CONFLICT,
    },
  ];

  /**
   * Enhance parsed error with pattern detection
   * Only applies to string errors that need detection
   */
  enhance(parsedError: ParsedError): ParsedError {
    // Only detect patterns if status code is generic 500
    if (parsedError.statusCode !== Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      return parsedError;
    }

    const message = parsedError.message.toLowerCase();
    const matchedPattern = this.findMatchingPattern(message);

    if (matchedPattern) {
      return {
        ...parsedError,
        statusCode: matchedPattern.statusCode,
        message: matchedPattern.message || parsedError.message,
      };
    }

    return parsedError;
  }

  /**
   * Find first matching pattern for the error message
   */
  private findMatchingPattern(message: string): ErrorPattern | null {
    for (const pattern of this.patterns) {
      if (this.matchesPattern(message, pattern.keywords)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Check if message matches any keyword in the pattern
   */
  private matchesPattern(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Add custom error pattern dynamically (for extensibility)
   * THESIS NOTE: Demonstrates Open/Closed Principle
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }
}
