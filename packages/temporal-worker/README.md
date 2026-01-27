# Temporal Worker

Temporal Worker package that executes workflows and activities for distributed orchestration.

## Overview

This package provides:
- **Activities**: Pure functions that interact with external APIs (Location, Weather, CatFact, Payment)
- **Workflows**: Durable orchestration logic (User Context Aggregation, Payment with Saga)
- **Worker Process**: Connects to Temporal Server and executes tasks

## Architecture

```
Temporal Worker
├── Activities (External API calls)
│   ├── location.activity.ts    - IP-based geolocation
│   ├── weather.activity.ts     - Weather by coordinates
│   ├── cat-fact.activity.ts    - Random cat facts
│   └── payment.activity.ts     - Fake Stripe payments
│
├── Workflows (Orchestration logic)
│   ├── user-context.workflow.ts - Aggregate user context
│   └── payment.workflow.ts      - Payment with Saga pattern
│
└── worker.ts - Worker process entry point
```

## Features

### Activities
- **Pure Functions**: Stateless, deterministic, testable
- **Automatic Retry**: Exponential backoff with configurable policies
- **Structured Logging**: Correlation ID propagation
- **Error Handling**: Graceful degradation on partial failures

### Workflows
- **Durable Execution**: Survives process crashes
- **Partial Failure Handling**: Returns null for failed services
- **Signals**: Cancel workflows in progress
- **Queries**: Real-time progress tracking
- **Two Strategies**: Parallel (fast) and Sequential (educational)

### Saga Pattern (Payment Workflow)
- **Automatic Retry**: On transient failures (timeout, 500 errors)
- **Fast Fail**: On permanent failures (402 payment declined)
- **Compensation**: Execute rollback on failure
- **Audit Trail**: Full history in Temporal UI

## Configuration

Environment variables (see `.env.example`):

```bash
TEMPORAL_ADDRESS=localhost:7233        # Temporal Server address
TEMPORAL_NAMESPACE=default             # Temporal namespace
TEMPORAL_TASK_QUEUE=founder-tasks      # Task queue name
OPENWEATHER_API_KEY=your-api-key      # OpenWeatherMap API key
FAKE_STRIPE_URL=http://localhost:3001  # Fake Stripe service URL
```

## Running Locally

### Prerequisites
- Node.js 20+
- Temporal Server running (see docker-compose.yml)

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t temporal-worker .
docker run --env-file .env temporal-worker
```

## Activity Retry Policies

### Location/Weather/CatFact Activities
- **Initial Interval**: 1 second
- **Backoff Coefficient**: 2x
- **Maximum Interval**: 10 seconds
- **Maximum Attempts**: 3
- **Timeout**: 30 seconds

### Payment Activity
- **Initial Interval**: 2 seconds
- **Backoff Coefficient**: 2x
- **Maximum Interval**: 30 seconds
- **Maximum Attempts**: 5
- **Timeout**: 30 seconds
- **Non-Retryable Errors**: Payment declined (402)

## Workflow Examples

### User Context Workflow (Parallel Strategy)
```typescript
// Workflow executes:
// 1. Location API call
// 2. Weather API call (after location)
// 3. CatFact API call (parallel)
//
// All API calls happen concurrently where possible
// Returns partial results if some APIs fail
```

### User Context Workflow (Sequential Strategy)
```typescript
// Workflow executes:
// 1. Location API call
// 2. Weather API call (wait for location)
// 3. CatFact API call (wait for weather)
//
// One API call at a time (slower, educational)
```

### Payment Workflow (Saga Pattern)
```typescript
// Workflow executes:
// 1. Process payment via Fake Stripe
// 2. On success: return response
// 3. On failure: execute compensation
//    - Log failure for audit
//    - Notify user/admin
//    - Refund if partially processed
```

## Monitoring

### Temporal UI
- **URL**: http://localhost:8080
- **Features**:
  - View workflow history
  - Inspect activity retries
  - Query workflow state
  - Cancel workflows
  - View full event history

### Logs
- Structured JSON logging
- Correlation ID in all logs
- Activity start/complete/error events
- Worker lifecycle events

## Graceful Shutdown

The worker handles graceful shutdown:
- Receives SIGTERM/SIGINT signals
- Stops accepting new tasks
- Completes in-flight activities
- Timeout: 30 seconds
- Clean connection close

## Troubleshooting

### Worker can't connect to Temporal Server
```bash
# Check Temporal Server is running
docker ps | grep temporal

# Check connectivity
nc -zv localhost 7233
```

### Activities timing out
- Check external API availability
- Verify API keys in environment
- Increase activity timeout if needed

### Workflow stuck
- Check Temporal UI for event history
- Look for failed activities
- Verify task queue name matches

## Development

### Adding New Activity
1. Create activity file in `src/activities/`
2. Export function with Context.current().log
3. Add to `activities/index.ts`
4. Register in `worker.ts`

### Adding New Workflow
1. Create workflow file in `src/workflows/`
2. Use proxyActivities for external calls
3. Export from `workflows/index.ts`
4. Workflows auto-discovered by Worker

## Testing

```bash
# Unit tests (coming soon)
npm test

# Manual testing via Temporal API
# See packages/temporal-api/requests.http
```

## Related Packages

- **temporal-api**: REST API for starting/managing workflows
- **founder**: Original REST API (pre-Temporal)
- **fake-stripe-chaos**: Chaos engineering payment service

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript)
- [Temporal Patterns](https://docs.temporal.io/patterns)
