import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Correlation ID Middleware
 *
 * Genera o extrae correlation ID de cada request para trazabilidad distribuida.
 *
 * Funcionalidad:
 * 1. Lee x-correlation-id del header (si el cliente lo envía)
 * 2. Genera nuevo UUID si no existe
 * 3. Añade al request para acceso en toda la app
 * 4. Añade al response header para que el cliente lo vea
 * 5. Logea el request con correlation ID
 *
 * Ventajas:
 * - Trazabilidad: Seguir un request a través de múltiples servicios
 * - Debugging: Buscar logs por correlation ID
 * - Monitoreo: Identificar requests lentos o con errores
 * - Distributed Tracing: Compatible con OpenTelemetry, Jaeger, etc.
 *
 * Uso en otros componentes:
 *   const correlationId = req['correlationId'];
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CorrelationID');

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Extraer correlation ID del header o generar nuevo
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

    // 2. Añadir al request para acceso en controllers, services, adapters
    req['correlationId'] = correlationId;

    // 3. Añadir al response header para que el cliente lo vea
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    // 4. Log de inicio de request con correlation ID
    this.logger.log({
      message: 'Incoming request',
      correlationId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    next();
  }
}
