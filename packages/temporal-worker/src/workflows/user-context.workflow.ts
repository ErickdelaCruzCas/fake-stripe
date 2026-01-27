import { proxyActivities, defineSignal, defineQuery, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities';
import { LocationData, WeatherData, CatFactData } from '../activities/types';

// Proxy activities with retry policies
const {
  getCurrentLocationActivity,
  getWeatherActivity,
  getCatFactActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumInterval: '10 seconds',
    maximumAttempts: 3,
  },
});

export interface UserContextResult {
  location: LocationData | null;
  weather: WeatherData | null;
  catFact: CatFactData | null;
  strategy: 'parallel' | 'sequential';
  executionTimeMs: number;
}

export interface WorkflowProgress {
  location: boolean;
  weather: boolean;
  catFact: boolean;
  completed: boolean;
}

// Signals
export const cancelSignal = defineSignal('cancel');

// Queries
export const progressQuery = defineQuery<WorkflowProgress>('progress');

/**
 * User Context Workflow
 *
 * Aggregates user context data from multiple external APIs:
 * 1. Location (IP-based geolocation)
 * 2. Weather (based on location coordinates)
 * 3. Cat Fact (random entertainment)
 *
 * Supports two execution strategies:
 * - parallel: Execute all API calls concurrently (faster, default)
 * - sequential: Execute API calls one after another (slower, educational)
 *
 * Features:
 * - Partial failure handling (returns null for failed services)
 * - Cancellation via signal
 * - Real-time progress tracking via query
 * - Automatic retry with exponential backoff
 *
 * @param correlationId - Distributed tracing ID
 * @param strategy - Execution strategy ('parallel' | 'sequential')
 * @returns Aggregated user context with execution metadata
 */
export async function userContextWorkflow(
  correlationId: string,
  strategy: 'parallel' | 'sequential' = 'parallel'
): Promise<UserContextResult> {
  const startTime = Date.now();
  let cancelled = false;

  // Progress tracking
  const progress: WorkflowProgress = {
    location: false,
    weather: false,
    catFact: false,
    completed: false,
  };

  // Handle cancellation signal
  setHandler(cancelSignal, () => {
    cancelled = true;
  });

  // Handle progress query
  setHandler(progressQuery, () => progress);

  let location: LocationData | null = null;
  let weather: WeatherData | null = null;
  let catFact: CatFactData | null = null;

  try {
    if (strategy === 'parallel') {
      // Parallel execution - all API calls concurrently
      const [locationResult, catFactResult, weatherResult] = await Promise.allSettled([
        getCurrentLocationActivity(correlationId).then((result) => {
          if (cancelled) throw new Error('Workflow cancelled');
          progress.location = true;
          return result;
        }),
        // Weather depends on location, but we can fetch cat fact in parallel
        getCatFactActivity(correlationId).then((result) => {
          if (cancelled) throw new Error('Workflow cancelled');
          progress.catFact = true;
          return result;
        }),
        // Fetch location first, then weather
        (async () => {
          const loc = await getCurrentLocationActivity(correlationId);
          if (cancelled) throw new Error('Workflow cancelled');
          progress.location = true;
          const wea = await getWeatherActivity(loc.latitude, loc.longitude, correlationId);
          if (cancelled) throw new Error('Workflow cancelled');
          progress.weather = true;
          return wea;
        })(),
      ]);

      // Extract results (handle partial failures)
      if (locationResult.status === 'fulfilled') {
        location = locationResult.value;
      }

      if (catFactResult.status === 'fulfilled') {
        catFact = catFactResult.value;
      }

      if (weatherResult.status === 'fulfilled') {
        weather = weatherResult.value;
      }
    } else {
      // Sequential execution - one API call at a time
      try {
        if (cancelled) throw new Error('Workflow cancelled');
        location = await getCurrentLocationActivity(correlationId);
        progress.location = true;
      } catch (error) {
        // Continue even if location fails
        location = null;
      }

      if (location) {
        try {
          if (cancelled) throw new Error('Workflow cancelled');
          weather = await getWeatherActivity(
            location.latitude,
            location.longitude,
            correlationId
          );
          progress.weather = true;
        } catch (error) {
          // Continue even if weather fails
          weather = null;
        }
      }

      try {
        if (cancelled) throw new Error('Workflow cancelled');
        catFact = await getCatFactActivity(correlationId);
        progress.catFact = true;
      } catch (error) {
        // Continue even if cat fact fails
        catFact = null;
      }
    }

    progress.completed = true;
    const executionTimeMs = Date.now() - startTime;

    return {
      location,
      weather,
      catFact,
      strategy,
      executionTimeMs,
    };
  } catch (error) {
    if (cancelled) {
      progress.completed = true;
      throw new Error('Workflow cancelled by user');
    }
    throw error;
  }
}
