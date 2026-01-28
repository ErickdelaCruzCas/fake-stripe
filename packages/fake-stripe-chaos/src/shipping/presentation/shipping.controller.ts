import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateLabelUseCase } from '../application/use-cases/create-label.use-case';
import { CancelLabelUseCase } from '../application/use-cases/cancel-label.use-case';
import {
  CreateLabelDto,
  CreateLabelResponseDto,
} from '../application/dto/create-label.dto';
import {
  CancelLabelDto,
  CancelLabelResponseDto,
} from '../application/dto/cancel-label.dto';
import { BaseErrorResponseDto } from '../../shared/dto/base-response.dto';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly createLabelUseCase: CreateLabelUseCase,
    private readonly cancelLabelUseCase: CancelLabelUseCase
  ) {}

  @Post('create-label')
  @ApiOperation({
    summary: 'Create shipping label (long-running operation)',
    description: `
      Genera una etiqueta de envío (operación larga ~20s con heartbeats).

      Chaos scenarios (60% success, 20% address error, 10% timeout, 10% carrier error):
      - 60% Success - Label generada exitosamente
      - 20% Address Validation Failed (400) - Dirección inválida
      - 10% Timeout (408) - Timeout generando label (20s)
      - 10% Carrier Error (503) - Carrier no disponible

      Esta operación simula un proceso largo con progreso incremental,
      ideal para demostrar Activity Heartbeats en Temporal.
    `,
  })
  @ApiBody({ type: CreateLabelDto })
  @ApiResponse({
    status: 201,
    description: 'Shipping label created successfully',
    type: CreateLabelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Address validation failed',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 408,
    description: 'Timeout',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Carrier service unavailable',
    type: BaseErrorResponseDto,
  })
  async createLabel(
    @Body() dto: CreateLabelDto,
    @Req() req: Request
  ): Promise<CreateLabelResponseDto> {
    const correlationId = req['correlationId'];
    // Sin callback de progreso en HTTP (se usa en Temporal activities)
    return this.createLabelUseCase.execute(dto, correlationId);
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancel shipping label (compensation)',
    description: `
      Cancela una etiqueta de envío (compensation action en Saga).

      Chaos scenarios (95% success, 5% error):
      - 95% Success - Label cancelada
      - 5% Internal Error (500) - Error del sistema

      Casos de uso:
      - Fallo en notification después de crear label
      - Manager rechaza pedido
      - Usuario cancela
    `,
  })
  @ApiBody({ type: CancelLabelDto })
  @ApiResponse({
    status: 200,
    description: 'Label cancelled successfully',
    type: CancelLabelResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Label not found',
    type: BaseErrorResponseDto,
  })
  async cancel(
    @Body() dto: CancelLabelDto,
    @Req() req: Request
  ): Promise<CancelLabelResponseDto> {
    const correlationId = req['correlationId'];
    return this.cancelLabelUseCase.execute(dto, correlationId);
  }
}
