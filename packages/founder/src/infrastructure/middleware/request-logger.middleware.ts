import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 *
 * Logea el inicio y fin de cada HTTP request con métricas de performance.
 *
 * Logs incluyen:
 * - Correlation ID (del middleware anterior)
 * - Método HTTP y URL
 * - Status code de respuesta
 * - Duración del request en ms
 * - User agent e IP (solo en inicio)
 *
 * Este middleware debe ejecutarse DESPUÉS de CorrelationIdMiddleware
 * para tener acceso al correlationId en el request.
 *
 * Formato de log:
 * {
 *   message: "Request completed",
 *   correlationId: "a1b2c3d4-e5f6-...",
 *   method: "GET",
 *   url: "/api/v1/user-context",
 *   statusCode: 200,
 *   durationMs: 450
 * }
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const correlationId = req['correlationId'] || 'N/A';
    const startTime = Date.now();

    // Log de request completado cuando termine
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Determinar nivel de log basado en status code
      const logLevel =
        statusCode >= 500
          ? 'error'
          : statusCode >= 400
          ? 'warn'
          : 'log';

      this.logger[logLevel]({
        message: 'Request completed',
        correlationId,
        method,
        url: originalUrl,
        statusCode,
        durationMs: duration,
      });
    });

    next();
  }
}
