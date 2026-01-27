import { Controller, Post, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { ChargeDto } from './dto/charge.dto';
import {
  ChargeResponseDto,
  ChargeErrorResponseDto,
} from './dto/charge-response.dto';

/**
 * Payment Controller
 *
 * Endpoints para procesar pagos con chaos engineering.
 */
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('charge')
  @ApiOperation({
    summary: 'Process a payment charge',
    description: `
      Procesa un cargo de pago con chaos engineering.

      Distribución de respuestas:
      - 40% Success (200) - Cargo procesado exitosamente
      - 30% Timeout (408) - Servicio lento, 5s delay + timeout
      - 20% Internal Error (500) - Error del servidor
      - 10% Payment Required (402) - Fondos insuficientes

      El servicio incluye correlation ID propagation para distributed tracing.
    `,
  })
  @ApiBody({ type: ChargeDto })
  @ApiResponse({
    status: 200,
    description: 'Charge processed successfully',
    type: ChargeResponseDto,
  })
  @ApiResponse({
    status: 402,
    description: 'Payment Required - Insufficient funds',
    type: ChargeErrorResponseDto,
  })
  @ApiResponse({
    status: 408,
    description: 'Request Timeout - Payment service timeout',
    type: ChargeErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ChargeErrorResponseDto,
  })
  async charge(
    @Body() chargeDto: ChargeDto,
    @Req() req: Request
  ): Promise<ChargeResponseDto> {
    const correlationId = req['correlationId'];
    return this.paymentService.charge(chargeDto, correlationId);
  }
}
