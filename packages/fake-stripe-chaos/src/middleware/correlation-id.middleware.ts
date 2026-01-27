import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CorrelationID');

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

    req['correlationId'] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Incoming request',
        correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      })
    );

    next();
  }
}
