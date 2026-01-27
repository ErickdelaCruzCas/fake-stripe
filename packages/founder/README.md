# Founder - User Context Aggregator

Phase 1 of the Fake Stripe project. A production-grade API aggregator built with hexagonal architecture.

## Features

- **Hexagonal Architecture** - Clean separation of domain, application, and infrastructure
- **3 External APIs** - Aggregates location (IPApi), weather (OpenWeatherMap), and cat facts
- **3 Concurrency Strategies** - Compare different approaches to parallel API calls
- **Fault Tolerant** - Returns partial results if some APIs fail
- **Swagger Documentation** - Auto-generated API docs
- **Docker Ready** - Containerized deployment

## Architecture

```
src/
├── domain/
│   ├── models/          # Business entities
│   ├── ports/           # Interfaces for external dependencies
│   └── services/        # Business logic
├── application/
│   ├── use-cases/       # Application-specific business rules
│   └── dto/             # Data transfer objects
├── infrastructure/
│   ├── adapters/        # External API implementations
│   ├── strategies/      # Concurrency strategy implementations
│   └── config/          # Configuration
└── presentation/
    └── controllers/     # REST API endpoints
```

## Concurrency Strategies

### 1. Promise.allSettled() (Default)
- **Performance:** High (~300-500ms)
- **Complexity:** Low
- **Use Case:** Production-ready, fault-tolerant

### 2. RxJS
- **Performance:** High (~300-500ms)
- **Complexity:** Medium
- **Use Case:** Complex reactive streams

### 3. Async Sequential
- **Performance:** Low (~800-1200ms)
- **Complexity:** Very Low
- **Use Case:** Debugging, strict dependencies

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Mode

```bash
npm run dev
```

### Run with Docker

```bash
# From project root
docker-compose up -d founder

# View logs
docker-compose logs -f founder
```

### Test with REST Client

Open `../../requests.http` in VS Code with REST Client extension.

## API Endpoints

### Get User Context

```
GET /api/v1/user-context?strategy={name}
```

**Query Parameters:**
- `strategy` (optional) - Concurrency strategy: `promise-allsettled` (default), `rxjs`, or `async-sequential`

**Response:**
```json
{
  "location": {
    "ip": "203.0.113.42",
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timezone": "America/Los_Angeles"
  },
  "weather": {
    "description": "Clear sky",
    "temperature": 18.5,
    "feelsLike": 17.2,
    "humidity": 65,
    "windSpeed": 3.5
  },
  "entertainment": {
    "catFact": "Cats sleep 70% of their lives.",
    "source": "catfact.ninja"
  },
  "aggregatedAt": "2024-01-26T10:30:00.000Z",
  "processingTimeMs": 450,
  "strategyUsed": "promise-allsettled"
}
```

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-26T10:30:00.000Z"
}
```

## Swagger UI

Once the server is running, access interactive API documentation at:

```
http://localhost:3000/api/docs
```

## External APIs Used

| API | Purpose | Rate Limits |
|-----|---------|-------------|
| [IPApi](https://ipapi.co/) | Geolocation by IP | 1000/day (free) |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather data | 1000/day (free) |
| [Cat Facts](https://catfact.ninja/) | Random facts | Unlimited |

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Configuration:**
```bash
NODE_ENV=development
PORT=3000
OPENWEATHER_API_KEY=your_api_key_here
AGGREGATION_STRATEGY=promise-allsettled
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# User context (default strategy)
curl http://localhost:3000/api/v1/user-context

# User context (RxJS strategy)
curl http://localhost:3000/api/v1/user-context?strategy=rxjs

# User context (Sequential strategy)
curl http://localhost:3000/api/v1/user-context?strategy=async-sequential
```

### Compare Strategies

Run the same endpoint with different strategies and compare `processingTimeMs`:

- `promise-allsettled`: ~300-500ms (parallel)
- `rxjs`: ~300-500ms (parallel)
- `async-sequential`: ~800-1200ms (sequential)

## Error Handling

The service is fault-tolerant. If an external API fails:

1. The field will be `null` in the response
2. An `errors` array will contain error messages
3. Other successful API calls are still returned

**Example with partial failure:**
```json
{
  "location": { ... },
  "weather": null,
  "entertainment": { ... },
  "errors": ["Weather fetch failed: timeout"],
  "aggregatedAt": "2024-01-26T10:30:00.000Z",
  "processingTimeMs": 520,
  "strategyUsed": "promise-allsettled"
}
```

## OpenAPI Specification Export

This project uses a **Code-First** approach with automatic OpenAPI spec generation.

### Export API Specification

Generate `openapi.json` and `openapi.yml` files:

```bash
npm run openapi:export
```

This creates:
- `openapi.json` - JSON format specification
- `openapi.yml` - YAML format specification (recommended for version control)

**When to export:**
- After adding/modifying endpoints
- Before committing API changes
- When you need to share the API contract

### Generate TypeScript Client

Generate a type-safe TypeScript client from the spec:

```bash
npm run openapi:generate-client
```

This creates a client in `../generated-clients/founder/` with:
- Auto-generated TypeScript types
- Axios-based HTTP client
- Full IntelliSense support

**Usage example:**

```typescript
import { UserContextApi, Configuration } from '@generated/founder-client';

const api = new UserContextApi(
  new Configuration({ basePath: 'http://localhost:3000' })
);

// Type-safe API calls
const response = await api.getUserContext('promise-allsettled');
console.log(response.data.location?.city); // ✅ TypeScript knows the structure
```

### Benefits

✅ **Single Source of Truth** - Code is the spec
✅ **Versioned Contract** - `openapi.yml` tracked in Git
✅ **Client Generation** - TypeScript, Python, Java, etc.
✅ **No Manual Sync** - Spec always matches implementation
✅ **Contract-First** - External teams can generate clients

## Development

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Run E2E Tests

```bash
npm run test:e2e
```

## Docker Commands

```bash
# Build image
docker build -t founder-service .

# Run container
docker run -p 3000:3000 --env-file .env founder-service

# Using docker-compose
docker-compose up -d founder
docker-compose logs -f founder
docker-compose down
```

## Troubleshooting

### Port already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### API timeouts
- IPApi has rate limits (1000/day)
- Check your OpenWeatherMap API key
- Verify internet connection

### Docker container won't start
```bash
# Check logs
docker-compose logs founder

# Rebuild
docker-compose build --no-cache founder
docker-compose up -d founder
```

## Next Phase

Phase 2 will add:
- Fake Stripe service with chaos engineering
- Premium endpoint requiring payment
- Retry logic for failed payments

See [../../CLAUDE.md](../../CLAUDE.md) for the full implementation plan.

## License

MIT - Learning project
