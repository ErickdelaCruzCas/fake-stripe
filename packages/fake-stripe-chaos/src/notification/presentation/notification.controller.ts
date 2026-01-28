import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { SendNotificationUseCase } from '../application/use-cases/send-notification.use-case';
import {
  SendNotificationDto,
  SendNotificationResponseDto,
} from '../application/dto/send-notification.dto';
import { BaseErrorResponseDto } from '../../shared/dto/base-response.dto';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly sendUseCase: SendNotificationUseCase) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send notification (email/SMS/push)',
    description: `
      Envía una notificación al cliente (NO crítica - puede fallar sin rollback).

      Chaos scenarios (80% success, 15% delivery failed, 5% invalid recipient):
      - 80% Success - Notificación enviada exitosamente
      - 15% Delivery Failed (502) - Servicio de email/SMS temporalmente no disponible
      - 5% Invalid Recipient (400) - Dirección inválida

      Esta operación es NON-CRITICAL en el flujo de Saga:
      - Si falla, NO se hace rollback de payment/inventory/shipping
      - Se registra el error pero el pedido continúa
      - Mejora UX pero no es bloqueante
    `,
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
    type: SendNotificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recipient',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 502,
    description: 'Delivery failed',
    type: BaseErrorResponseDto,
  })
  async send(
    @Body() dto: SendNotificationDto,
    @Req() req: Request
  ): Promise<SendNotificationResponseDto> {
    const correlationId = req['correlationId'];
    return this.sendUseCase.execute(dto, correlationId);
  }
}
