import { Injectable } from '@nestjs/common';
import {
  AggregationStrategy,
  AggregationResult,
} from '../../domain/ports/aggregation-strategy.port';
import { LocationPort } from '../../domain/ports/location.port';
import { WeatherPort } from '../../domain/ports/weather.port';
import { CatFactPort } from '../../domain/ports/cat-fact.port';
import { Location } from '../../domain/models/location.model';
import { Weather } from '../../domain/models/weather.model';
import { CatFact } from '../../domain/models/cat-fact.model';

@Injectable()
export class PromiseAllSettledStrategy implements AggregationStrategy {
  getName(): string {
    return 'promise-allsettled';
  }

  async aggregate(
    locationPort: LocationPort,
    weatherPort: WeatherPort,
    catFactPort: CatFactPort,
    correlationId: string
  ): Promise<AggregationResult> {
    const errors: string[] = [];
    const startTime = Date.now();

    // FAN-OUT: Execute location and catFact in parallel
    const [locationResult, catFactResult] = await Promise.allSettled([
      locationPort.getCurrentLocation(correlationId),
      catFactPort.getRandomFact(correlationId),
    ]);

    // Extract location (needed for weather)
    let location: Location | null = null;
    if (locationResult.status === 'fulfilled') {
      location = locationResult.value;
    } else {
      errors.push(`Location fetch failed: ${locationResult.reason.message}`);
    }

    // FAN-OUT: Call weather only if we have location
    let weather: Weather | null = null;
    if (location) {
      try {
        weather = await weatherPort.getWeatherByCoordinates(
          location.latitude,
          location.longitude,
          correlationId
        );
      } catch (error: any) {
        errors.push(`Weather fetch failed: ${error.message}`);
      }
    } else {
      errors.push('Weather fetch skipped: location unavailable');
    }

    // Extract catFact
    let catFact: CatFact | null = null;
    if (catFactResult.status === 'fulfilled') {
      catFact = catFactResult.value;
    } else {
      errors.push(`CatFact fetch failed: ${catFactResult.reason.message}`);
    }

    const duration = Date.now() - startTime;

    return {
      location,
      weather,
      entertainment: catFact,
      errors,
      strategyUsed: this.getName(),
    };
  }
}
