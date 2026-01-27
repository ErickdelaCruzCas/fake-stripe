import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserContextResponseDto } from '../../application/dto/user-context-response.dto';
import {
  StrategyFactory,
  StrategyType,
} from '../../domain/services/strategy-factory.service';
import { UuidService } from '../../infrastructure/services/uuid.service';
import { TimeService } from '../../infrastructure/services/time.service';
import { UserContextService } from '../../domain/services/user-context.service';

/**
 * User Context Controller
 *
 * Thin controller following SRP - only handles HTTP concerns:
 * - Route mapping
 * - Query parameter extraction
 * - Response formatting
 *
 * Business logic delegated to:
 * - UserContextService (aggregation orchestration)
 * - StrategyFactory (strategy selection)
 * - UuidService (ID generation)
 * - TimeService (timing)
 */
@ApiTags('user-context')
@Controller('api/v1')
export class UserContextController {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly strategyFactory: StrategyFactory,
    private readonly uuidService: UuidService,
    private readonly timeService: TimeService
  ) {}

  @Get('user-context')
  @ApiOperation({
    summary: 'Get aggregated user context',
    description:
      'Aggregates data from multiple external APIs (location, weather, cat facts). Supports different concurrency strategies.',
  })
  @ApiQuery({
    name: 'strategy',
    required: false,
    enum: Object.values(StrategyType),
    description: 'Aggregation strategy to use (default: promise-allsettled)',
  })
  @ApiResponse({
    status: 200,
    description: 'User context successfully aggregated',
    type: UserContextResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid strategy name',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getUserContext(
    @Query('strategy') strategyName?: string
  ): Promise<UserContextResponseDto> {
    // Generate correlation ID for distributed tracing
    const correlationId = this.uuidService.generate();

    // Get strategy (validates strategy name, throws BadRequestException if invalid)
    const strategy = this.strategyFactory.getStrategy(strategyName);

    // Start timing
    const startTime = this.timeService.now();

    // Delegate to service
    const result = await this.userContextService.aggregateWithStrategy(
      strategy,
      correlationId
    );

    // Calculate processing time
    const processingTime = this.timeService.duration(startTime);

    // Format response
    return {
      location: result.location,
      weather: result.weather,
      entertainment: result.entertainment,
      aggregatedAt: this.timeService.currentDate(),
      processingTimeMs: processingTime,
      strategyUsed: result.strategyUsed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    };
  }
}
