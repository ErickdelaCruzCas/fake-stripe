import { Inject, Injectable } from '@nestjs/common';
import {
  AggregationStrategy,
  AggregationResult,
} from '../ports/aggregation-strategy.port';
import { LocationPort, LOCATION_PORT } from '../ports/location.port';
import { WeatherPort, WEATHER_PORT } from '../ports/weather.port';
import { CatFactPort, CAT_FACT_PORT } from '../ports/cat-fact.port';

/**
 * User Context Service
 *
 * Orchestrates aggregation of user context from multiple sources.
 * Delegates actual aggregation to strategies.
 */
@Injectable()
export class UserContextService {
  constructor(
    @Inject(LOCATION_PORT)
    private readonly locationPort: LocationPort,
    @Inject(WEATHER_PORT)
    private readonly weatherPort: WeatherPort,
    @Inject(CAT_FACT_PORT)
    private readonly catFactPort: CatFactPort
  ) {}

  /**
   * Aggregate user context using provided strategy
   * @param strategy - The aggregation strategy to use
   * @param correlationId - Correlation ID for distributed tracing
   * @returns Aggregation result
   */
  async aggregateWithStrategy(
    strategy: AggregationStrategy,
    correlationId: string
  ): Promise<AggregationResult> {
    return await strategy.aggregate(
      this.locationPort,
      this.weatherPort,
      this.catFactPort,
      correlationId
    );
  }
}
