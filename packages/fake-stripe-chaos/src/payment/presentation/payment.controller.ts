import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizePaymentUseCase } from '../application/use-cases/authorize-payment.use-case';
import { CapturePaymentUseCase } from '../application/use-cases/capture-payment.use-case';
import { ReleasePaymentUseCase } from '../application/use-cases/release-payment.use-case';
import { RefundPaymentUseCase } from '../application/use-cases/refund-payment.use-case';
import {
  AuthorizePaymentDto,
  AuthorizePaymentResponseDto,
} from '../application/dto/authorize-payment.dto';
import {
  CapturePaymentDto,
  CapturePaymentResponseDto,
} from '../application/dto/capture-payment.dto';
import {
  ReleasePaymentDto,
  ReleasePaymentResponseDto,
} from '../application/dto/release-payment.dto';
import {
  RefundPaymentDto,
  RefundPaymentResponseDto,
} from '../application/dto/refund-payment.dto';
import { BaseErrorResponseDto } from '../../shared/dto/base-response.dto';
import { PaymentChaosEngine } from '../infrastructure/chaos/payment-chaos.engine';

/**
 * Payment Controller
 *
 * Endpoints para operaciones de pago con chaos engineering.
 * Implementa hexagonal architecture: controller → use case → domain → infrastructure
 */
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly authorizeUseCase: AuthorizePaymentUseCase,
    private readonly captureUseCase: CapturePaymentUseCase,
    private readonly releaseUseCase: ReleasePaymentUseCase,
    private readonly refundUseCase: RefundPaymentUseCase,
    private readonly chaosEngine: PaymentChaosEngine
  ) {}

  @Post('authorize')
  @ApiOperation({
    summary: 'Authorize a payment (hold funds)',
    description: `
      Autoriza un pago sin capturarlo inmediatamente (similar a Stripe pre-authorization).
      Esto reserva fondos en la tarjeta del cliente por 7 días.

      Chaos scenarios (40% success, 30% insufficient funds, 20% timeout, 10% error):
      - 40% Success (200) - Autorización creada exitosamente
      - 30% Insufficient Funds (402) - Fondos insuficientes
      - 20% Timeout (408) - Banco tarda demasiado (5s delay)
      - 10% Internal Error (500) - Error del servidor

      Casos de uso:
      - E-commerce: Autorizar al hacer pedido, capturar al enviar
      - Hoteles: Autorizar al reservar, capturar al check-out
    `,
  })
  @ApiBody({ type: AuthorizePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment authorized successfully',
    type: AuthorizePaymentResponseDto,
  })
  @ApiResponse({
    status: 402,
    description: 'Payment Required - Insufficient funds',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 408,
    description: 'Request Timeout',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: BaseErrorResponseDto,
  })
  async authorize(
    @Body() dto: AuthorizePaymentDto,
    @Req() req: Request
  ): Promise<AuthorizePaymentResponseDto> {
    const correlationId = req['correlationId'];
    return this.authorizeUseCase.execute(dto, correlationId);
  }

  @Post('capture')
  @ApiOperation({
    summary: 'Capture an authorized payment',
    description: `
      Captura una autorización previamente creada, cargando los fondos definitivamente.

      Chaos scenarios (70% success, 20% already captured, 10% expired):
      - 70% Success (200) - Pago capturado exitosamente
      - 20% Already Captured (409) - Ya fue capturado previamente
      - 10% Authorization Expired (410) - La autorización expiró

      Debe llamarse después de /authorize y antes de que expire (7 días).
    `,
  })
  @ApiBody({ type: CapturePaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment captured successfully',
    type: CapturePaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Authorization not found',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Already captured',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Authorization expired',
    type: BaseErrorResponseDto,
  })
  async capture(
    @Body() dto: CapturePaymentDto,
    @Req() req: Request
  ): Promise<CapturePaymentResponseDto> {
    const correlationId = req['correlationId'];
    return this.captureUseCase.execute(dto, correlationId);
  }

  @Post('release')
  @ApiOperation({
    summary: 'Release an authorized payment (compensation)',
    description: `
      Libera una autorización sin capturarla (compensation action en Saga pattern).
      Los fondos vuelven a estar disponibles para el cliente.

      Chaos scenarios (85% success, 10% already released, 5% error):
      - 85% Success (200) - Autorización liberada
      - 10% Already Released (409) - Ya fue liberada previamente
      - 5% Internal Error (500) - Error del servidor

      Casos de uso:
      - Manager rechaza el pedido
      - Timeout esperando aprobación
      - Fallo en pasos posteriores (inventory, shipping)
    `,
  })
  @ApiBody({ type: ReleasePaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Authorization released successfully',
    type: ReleasePaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Authorization not found',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Already released',
    type: BaseErrorResponseDto,
  })
  async release(
    @Body() dto: ReleasePaymentDto,
    @Req() req: Request
  ): Promise<ReleasePaymentResponseDto> {
    const correlationId = req['correlationId'];
    return this.releaseUseCase.execute(dto, correlationId);
  }

  @Post('refund')
  @ApiOperation({
    summary: 'Refund a captured payment (compensation)',
    description: `
      Reembolsa un pago ya capturado (compensation action en Saga pattern).
      Los fondos son devueltos al cliente.

      Chaos scenarios (75% success, 15% timeout, 10% error):
      - 75% Success (200) - Reembolso procesado exitosamente
      - 15% Timeout (408) - Banco tarda demasiado (4s delay)
      - 10% Internal Error (500) - Error del servidor

      Soporta reembolsos parciales o totales.

      Casos de uso:
      - Fallo en shipping después de capturar pago
      - Cliente cancela después de ser cargado
      - Producto defectuoso o insatisfacción
    `,
  })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment refunded successfully',
    type: RefundPaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Authorization not found',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot refund (not captured or invalid amount)',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 408,
    description: 'Request Timeout',
    type: BaseErrorResponseDto,
  })
  async refund(
    @Body() dto: RefundPaymentDto,
    @Req() req: Request
  ): Promise<RefundPaymentResponseDto> {
    const correlationId = req['correlationId'];
    return this.refundUseCase.execute(dto, correlationId);
  }

  @Get('chaos/distribution')
  @ApiOperation({
    summary: 'Get chaos scenarios distribution',
    description: 'Returns the probability distribution for all payment operations',
  })
  async getChaosDistribution() {
    return {
      success: true,
      distributions: this.chaosEngine.getAllDistributions(),
    };
  }
}
