import {
  Controller,
  Get,
  Query,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UserContextResponseDto } from '../../application/dto/user-context-response.dto';
import { PromiseAllSettledStrategy } from '../../infrastructure/strategies/promise-allsettled.strategy';
import { RxJSStrategy } from '../../infrastructure/strategies/rxjs.strategy';
import { AsyncSequentialStrategy } from '../../infrastructure/strategies/async-sequential.strategy';
import { LOCATION_PORT, LocationPort } from '../../domain/ports/location.port';
import { WEATHER_PORT, WeatherPort } from '../../domain/ports/weather.port';
import { CAT_FACT_PORT, CatFactPort } from '../../domain/ports/cat-fact.port';
import { AggregationStrategy } from '../../domain/ports/aggregation-strategy.port';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('user-context')
@Controller('api/v1')
export class UserContextController {
  constructor(
    private readonly promiseStrategy: PromiseAllSettledStrategy,
    private readonly rxjsStrategy: RxJSStrategy,
    private readonly sequentialStrategy: AsyncSequentialStrategy,
    @Inject(LOCATION_PORT) private readonly locationPort: LocationPort,
    @Inject(WEATHER_PORT) private readonly weatherPort: WeatherPort,
    @Inject(CAT_FACT_PORT) private readonly catFactPort: CatFactPort
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
    enum: ['promise-allsettled', 'rxjs', 'async-sequential'],
    description: 'Aggregation strategy to use (default: promise-allsettled)',
  })
  @ApiResponse({
    status: 200,
    description: 'User context successfully aggregated',
    type: UserContextResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getUserContext(
    @Query('strategy') strategyName?: string
  ): Promise<UserContextResponseDto> {
    const correlationId = uuidv4();

    // Select strategy based on query parameter
    let strategy: AggregationStrategy;
    switch (strategyName) {
      case 'rxjs':
        strategy = this.rxjsStrategy;
        break;
      case 'async-sequential':
        strategy = this.sequentialStrategy;
        break;
      case 'promise-allsettled':
      default:
        strategy = this.promiseStrategy;
    }

    const startTime = Date.now();

    try {
      const result = await strategy.aggregate(
        this.locationPort,
        this.weatherPort,
        this.catFactPort,
        correlationId
      );

      const processingTime = Date.now() - startTime;

      return {
        location: result.location,
        weather: result.weather,
        entertainment: result.entertainment,
        aggregatedAt: new Date(),
        processingTimeMs: processingTime,
        strategyUsed: result.strategyUsed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to aggregate user context: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
