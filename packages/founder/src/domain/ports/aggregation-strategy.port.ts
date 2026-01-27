import { Location } from '../models/location.model';
import { Weather } from '../models/weather.model';
import { CatFact } from '../models/cat-fact.model';
import { LocationPort } from './location.port';
import { WeatherPort } from './weather.port';
import { CatFactPort } from './cat-fact.port';

export interface AggregationResult {
  location: Location | null;
  weather: Weather | null;
  entertainment: CatFact | null;
  errors: string[];
  strategyUsed: string;
}

export interface AggregationStrategy {
  /**
   * Aggregates data from multiple sources using a specific concurrency strategy
   * @param locationPort - Port for location data
   * @param weatherPort - Port for weather data
   * @param catFactPort - Port for cat facts
   * @param correlationId - Request correlation ID for tracing
   */
  aggregate(
    locationPort: LocationPort,
    weatherPort: WeatherPort,
    catFactPort: CatFactPort,
    correlationId: string
  ): Promise<AggregationResult>;

  /**
   * Get the name of the strategy for logging/debugging
   */
  getName(): string;
}

export const AGGREGATION_STRATEGY = Symbol('AggregationStrategy');
