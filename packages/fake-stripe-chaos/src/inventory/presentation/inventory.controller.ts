import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ReserveInventoryUseCase } from '../application/use-cases/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from '../application/use-cases/release-inventory.use-case';
import {
  ReserveInventoryDto,
  ReserveInventoryResponseDto,
} from '../application/dto/reserve-inventory.dto';
import {
  ReleaseInventoryDto,
  ReleaseInventoryResponseDto,
} from '../application/dto/release-inventory.dto';
import { BaseErrorResponseDto } from '../../shared/dto/base-response.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly reserveUseCase: ReserveInventoryUseCase,
    private readonly releaseUseCase: ReleaseInventoryUseCase
  ) {}

  @Post('reserve')
  @ApiOperation({
    summary: 'Reserve inventory items',
    description: `
      Reserva items en inventario para un pedido (expira en 30 minutos).

      Chaos scenarios (50% success, 30% out of stock, 10% timeout, 10% error):
      - 50% Success - Items reservados exitosamente
      - 30% Out of Stock (409) - Uno o más items sin stock
      - 10% Timeout (408) - Sistema de inventario lento (4s)
      - 10% Internal Error (500) - Error del sistema

      La reserva expira automáticamente después de 30 minutos.
    `,
  })
  @ApiBody({ type: ReserveInventoryDto })
  @ApiResponse({
    status: 201,
    description: 'Inventory reserved successfully',
    type: ReserveInventoryResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Out of stock',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: 408,
    description: 'Timeout',
    type: BaseErrorResponseDto,
  })
  async reserve(
    @Body() dto: ReserveInventoryDto,
    @Req() req: Request
  ): Promise<ReserveInventoryResponseDto> {
    const correlationId = req['correlationId'];
    return this.reserveUseCase.execute(dto, correlationId);
  }

  @Post('release')
  @ApiOperation({
    summary: 'Release inventory reservation (compensation)',
    description: `
      Libera una reserva de inventario (compensation action en Saga).
      Los items vuelven a estar disponibles.

      Chaos scenarios (90% success, 10% error):
      - 90% Success - Reserva liberada
      - 10% Internal Error (500) - Error del sistema

      Casos de uso:
      - Fallo en payment capture
      - Fallo en shipping
      - Timeout en aprobación
    `,
  })
  @ApiBody({ type: ReleaseInventoryDto })
  @ApiResponse({
    status: 200,
    description: 'Reservation released successfully',
    type: ReleaseInventoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
    type: BaseErrorResponseDto,
  })
  async release(
    @Body() dto: ReleaseInventoryDto,
    @Req() req: Request
  ): Promise<ReleaseInventoryResponseDto> {
    const correlationId = req['correlationId'];
    return this.releaseUseCase.execute(dto, correlationId);
  }
}
