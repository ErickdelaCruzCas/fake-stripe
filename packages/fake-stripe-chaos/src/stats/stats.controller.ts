import { Controller, Get, Post, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StatsService } from './stats.service';

/**
 * Stats Controller
 *
 * Endpoints para ver estadísticas de chaos engineering.
 */
@ApiTags('stats')
@Controller('payment/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get payment statistics',
    description: `
      Retorna estadísticas agregadas de todos los payment requests procesados.

      Incluye:
      - Total de requests
      - Distribución de success/timeout/errors
      - Success rate
      - Porcentajes de cada escenario

      Útil para validar que la distribución de chaos engine es correcta.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalRequests: 100,
        successful: 40,
        timeouts: 30,
        errors500: 20,
        errors402: 10,
        successRate: '0.40',
        distribution: {
          timeout: '30.0%',
          error500: '20.0%',
          error402: '10.0%',
          success: '40.0%',
        },
      },
    },
  })
  getStats() {
    return this.statsService.getStats();
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent requests',
    description: 'Retorna los últimos N requests procesados (default: 10)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent requests to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent requests retrieved successfully',
  })
  getRecentRequests(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.statsService.getRecentRequests(limit);
  }

  @Post('reset')
  @ApiOperation({
    summary: 'Reset statistics',
    description: 'Resetea todas las estadísticas (útil para testing)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics reset successfully',
    schema: {
      example: {
        message: 'Statistics reset successfully',
      },
    },
  })
  reset() {
    this.statsService.reset();
    return { message: 'Statistics reset successfully' };
  }
}
