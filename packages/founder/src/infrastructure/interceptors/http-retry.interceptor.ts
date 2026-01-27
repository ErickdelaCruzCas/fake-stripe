import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';
import { AxiosError } from 'axios';

/**
 * HTTP Retry Interceptor
 *
 * Implementa política de reintentos automáticos para llamadas HTTP fallidas.
 *
 * Política de retry:
 * - Máximo 3 intentos
 * - Delay exponencial: 1s, 2s, 4s
 * - Solo reintenta en errores 5xx (server errors)
 * - No reintenta en 4xx (client errors) - son permanentes
 *
 * Ventajas sobre retry manual:
 * 1. Centralizado - todas las APIs externas tienen retry automático
 * 2. Configurable - puedes cambiar la estrategia en un solo lugar
 * 3. Observable - usa operadores RxJS para composición
 * 4. Testing - mockeable en tests
 */
@Injectable()
export class HttpRetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRetry');
  private readonly maxRetries = 3;
  private readonly retryableStatusCodes = [500, 502, 503, 504];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'] || 'N/A';

    return next.handle().pipe(
      retry({
        count: this.maxRetries,
        delay: (error: AxiosError, retryCount: number) => {
          const status = error.response?.status;

          // No reintentar errores 4xx (client errors)
          if (status && status >= 400 && status < 500) {
            this.logger.warn(
              JSON.stringify({
                message: 'Client error - no retry',
                correlationId,
                status,
                url: error.config?.url,
              })
            );
            return throwError(() => error);
          }

          // No reintentar si no es un error retryable
          if (status && !this.retryableStatusCodes.includes(status)) {
            return throwError(() => error);
          }

          // Backoff exponencial: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount - 1) * 1000;

          this.logger.warn(
            JSON.stringify({
              message: `Retrying HTTP request (attempt ${retryCount}/${this.maxRetries})`,
              correlationId,
              status,
              url: error.config?.url,
              delayMs,
            })
          );

          // Retornar observable que emite después del delay
          return throwError(() => error).pipe(delay(delayMs));
        },
      }),
      catchError((error: AxiosError) => {
        // Si después de todos los reintentos sigue fallando
        this.logger.error(
          JSON.stringify({
            message: 'HTTP request failed after all retries',
            correlationId,
            status: error.response?.status,
            url: error.config?.url,
            maxRetries: this.maxRetries,
          })
        );

        return throwError(() => error);
      })
    );
  }
}
