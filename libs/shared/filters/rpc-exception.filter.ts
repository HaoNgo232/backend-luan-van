import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Global RPC Exception Filter
 * Ensures consistent error format across all microservices
 */
@Catch(RpcException)
export class AllRpcExceptionsFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const error = exception.getError();

    // Format error response
    const errorResponse = {
      statusCode:
        typeof error === 'object' && 'statusCode' in error
          ? (error as { statusCode: number }).statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        typeof error === 'string'
          ? error
          : typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Internal server error',
      error:
        typeof error === 'object' && 'error' in error
          ? (error as { error: string }).error
          : 'RpcException',
      timestamp: new Date().toISOString(),
    };

    console.error('[RpcException]', errorResponse);

    return throwError(() => errorResponse);
  }
}
