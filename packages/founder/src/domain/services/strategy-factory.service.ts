import { Injectable, BadRequestException } from '@nestjs/common';
import { AggregationStrategy } from '../ports/aggregation-strategy.port';
import { PromiseAllSettledStrategy } from '../../infrastructure/strategies/promise-allsettled.strategy';
import { RxJSStrategy } from '../../infrastructure/strategies/rxjs.strategy';
import { AsyncSequentialStrategy } from '../../infrastructure/strategies/async-sequential.strategy';

/**
 * Strategy type enum for type safety
 */
export enum StrategyType {
  PROMISE_ALLSETTLED = 'promise-allsettled',
  RXJS = 'rxjs',
  ASYNC_SEQUENTIAL = 'async-sequential',
}

/**
 * StrategyFactory Service
 *
 * Factory pattern for creating aggregation strategies.
 * Separates strategy selection logic from controller (SRP).
 *
 * Benefits:
 * - Single source of truth for strategy selection
 * - Easy to test independently
 * - Easy to add new strategies
 * - Type-safe strategy names
 */
@Injectable()
export class StrategyFactory {
  constructor(
    private readonly promiseStrategy: PromiseAllSettledStrategy,
    private readonly rxjsStrategy: RxJSStrategy,
    private readonly sequentialStrategy: AsyncSequentialStrategy
  ) {}

  /**
   * Get strategy by name
   * @throws BadRequestException if strategy name is invalid
   */
  getStrategy(strategyName?: string): AggregationStrategy {
    const strategy = strategyName?.toLowerCase() || StrategyType.PROMISE_ALLSETTLED;

    switch (strategy) {
      case StrategyType.RXJS:
        return this.rxjsStrategy;

      case StrategyType.ASYNC_SEQUENTIAL:
        return this.sequentialStrategy;

      case StrategyType.PROMISE_ALLSETTLED:
        return this.promiseStrategy;

      default:
        throw new BadRequestException(
          `Invalid strategy: ${strategyName}. Valid options: ${Object.values(StrategyType).join(', ')}`
        );
    }
  }

  /**
   * Get all available strategy names
   */
  getAvailableStrategies(): string[] {
    return Object.values(StrategyType);
  }

  /**
   * Get default strategy
   */
  getDefaultStrategy(): AggregationStrategy {
    return this.promiseStrategy;
  }
}
