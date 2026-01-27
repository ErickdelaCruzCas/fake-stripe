import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * HTTP Logging Interceptor
 *
 * Intercepta todas las peticiones HTTP salientes y logea:
 * - URL de destino
 * - Método HTTP
 * - Tiempo de respuesta
 * - Status code
 * - Correlation ID (si está disponible)
 *
 * Ventajas de usar HttpService con interceptores:
 * 1. Logging centralizado de todas las llamadas externas
 * 2. Fácil añadir tracing distribuido (OpenTelemetry, Jaeger)
 * 3. Retry automático configurable
 * 4. Testing más fácil con mocks
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpClient');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'] || 'N/A';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;

          // Log de request HTTP exitoso con correlation ID
          this.logger.log(
            JSON.stringify({
              message: 'HTTP request completed',
              correlationId,
              method: response?.config?.method?.toUpperCase() || 'GET',
              url: response?.config?.url || 'unknown',
              status: response?.status || 200,
              durationMs: duration,
            })
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Log de error HTTP con correlation ID
          this.logger.error(
            JSON.stringify({
              message: 'HTTP request failed',
              correlationId,
              method: error?.config?.method?.toUpperCase() || 'GET',
              url: error?.config?.url || 'unknown',
              status: error?.response?.status || 'NETWORK_ERROR',
              errorMessage: error?.message,
              durationMs: duration,
            })
          );
        },
      })
    );
  }
}
