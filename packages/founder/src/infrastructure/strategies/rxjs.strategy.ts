import { Injectable } from '@nestjs/common';
import { forkJoin, from, of, catchError } from 'rxjs';
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
export class RxJSStrategy implements AggregationStrategy {
  getName(): string {
    return 'rxjs';
  }

  async aggregate(
    locationPort: LocationPort,
    weatherPort: WeatherPort,
    catFactPort: CatFactPort,
    correlationId: string
  ): Promise<AggregationResult> {
    const errors: string[] = [];
    const startTime = Date.now();

    // Convert Promises to Observables with error handling
    const location$ = this.fromPromiseWithError(
      locationPort.getCurrentLocation(correlationId),
      'location',
      errors,
      correlationId
    );

    const catFact$ = this.fromPromiseWithError(
      catFactPort.getRandomFact(correlationId),
      'catFact',
      errors,
      correlationId
    );

    // FAN-OUT: Execute location and catFact in parallel with forkJoin
    const result = await new Promise<AggregationResult>((resolve) => {
      forkJoin({
        location: location$,
        catFact: catFact$,
      }).subscribe(async (parallelResults) => {
        // FAN-IN: Partial results from location and catFact
        const location = parallelResults.location;
        const catFact = parallelResults.catFact;

        // Call weather only if we have location
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

        const duration = Date.now() - startTime;

        resolve({
          location,
          weather,
          entertainment: catFact,
          errors,
          strategyUsed: this.getName(),
        });
      });
    });

    return result;
  }

  private fromPromiseWithError<T>(
    promise: Promise<T>,
    sourceName: string,
    errors: string[],
    correlationId: string
  ) {
    return from(promise).pipe(
      catchError((error) => {
        errors.push(`${sourceName} fetch failed: ${error.message}`);
        return of(null);
      })
    );
  }
}
