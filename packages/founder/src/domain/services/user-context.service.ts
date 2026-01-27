import { Inject, Injectable } from '@nestjs/common';
import { UserContext } from '../models/user-context.model';
import {
  AggregationStrategy,
  AGGREGATION_STRATEGY,
} from '../ports/aggregation-strategy.port';
import { LocationPort, LOCATION_PORT } from '../ports/location.port';
import { WeatherPort, WEATHER_PORT } from '../ports/weather.port';
import { CatFactPort, CAT_FACT_PORT } from '../ports/cat-fact.port';

@Injectable()
export class UserContextService {
  constructor(
    @Inject(AGGREGATION_STRATEGY)
    private readonly strategy: AggregationStrategy,
    @Inject(LOCATION_PORT)
    private readonly locationPort: LocationPort,
    @Inject(WEATHER_PORT)
    private readonly weatherPort: WeatherPort,
    @Inject(CAT_FACT_PORT)
    private readonly catFactPort: CatFactPort
  ) {}

  async aggregateUserContext(correlationId: string): Promise<UserContext> {
    const result = await this.strategy.aggregate(
      this.locationPort,
      this.weatherPort,
      this.catFactPort,
      correlationId
    );

    return new UserContext(
      result.location,
      result.weather,
      result.entertainment,
      new Date(),
      result.strategyUsed,
      result.errors
    );
  }
}
