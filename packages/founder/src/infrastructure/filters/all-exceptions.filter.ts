import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdapterError } from '../../common/errors/adapter.error';

/**
 * Global Exception Filter
 *
 * Catches all exceptions across the application and formats them consistently.
 *
 * Benefits:
 * - Centralized error handling (DRY)
 * - Consistent error format for clients
 * - Structured logging with correlation ID
 * - Removes error handling from controllers (SRP)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = request['correlationId'] || 'N/A';

    // Determine HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof AdapterError) {
      message = exception.message;
      error = exception.name;
    } else {
      message = AdapterError.extractMessage(exception);
      error = 'InternalServerError';
    }

    // Build error response
    const errorResponse = {
      statusCode: status,
      error,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error with context
    this.logger.error(
      JSON.stringify({
        message: 'Exception caught by global filter',
        correlationId,
        status,
        error,
        errorMessage: message,
        path: request.url,
        method: request.method,
        stack: exception instanceof Error ? exception.stack : undefined,
      })
    );

    // Send response
    response.status(status).json(errorResponse);
  }
}
