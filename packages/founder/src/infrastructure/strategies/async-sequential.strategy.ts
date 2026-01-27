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
export class AsyncSequentialStrategy implements AggregationStrategy {
  getName(): string {
    return 'async-sequential';
  }

  async aggregate(
    locationPort: LocationPort,
    weatherPort: WeatherPort,
    catFactPort: CatFactPort,
    correlationId: string
  ): Promise<AggregationResult> {
    const errors: string[] = [];
    const startTime = Date.now();

    // SEQUENTIAL (NO parallel): Calls one by one
    // Useful for demonstrating performance difference

    // 1. Location first
    let location: Location | null = null;
    try {
      location = await locationPort.getCurrentLocation(correlationId);
    } catch (error: any) {
      errors.push(`Location fetch failed: ${error.message}`);
    }

    // 2. Weather after (only if we have location)
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

    // 3. CatFact at the end
    let catFact: CatFact | null = null;
    try {
      catFact = await catFactPort.getRandomFact(correlationId);
    } catch (error: any) {
      errors.push(`CatFact fetch failed: ${error.message}`);
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
