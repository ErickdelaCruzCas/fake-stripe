# Fake Stripe - Progressive Microservices Architecture

A comprehensive learning project demonstrating evolutionary architecture: from simple aggregator to Temporal-orchestrated microservices with chaos engineering.

> 📋 **Current Phase**: Phase 3 - Temporal Orchestration ✅
> See [CLAUDE.md](./CLAUDE.md) for detailed documentation

## Quick Start

### Using Task (Recommended)

```bash
# Install Task: https://taskfile.dev/installation/
brew install go-task

# Start all services
task up

# Check service health
task health

# Test a workflow
task test:workflow

# Open Temporal UI
task ui

# View all commands
task --list
```

See [TASKFILE_README.md](./TASKFILE_README.md) for complete guide.

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Temporal API | http://localhost:3002/api/docs | REST API for workflows (Swagger) |
| Temporal UI | http://localhost:8080 | Workflow visibility & debugging |
| Founder API | http://localhost:3000/api/docs | Legacy REST API (Swagger) |
| Fake Stripe | http://localhost:3001/api/docs | Chaos payment service (Swagger) |

## Project Vision

This project evolves through 5 distinct phases, each building on the previous:

```
Phase 1: Aggregator    →  Phase 2: Chaos         →  Phase 3: Temporal      →  Phase 4: Observability  →  Phase 5: Production
(Hexagonal Arch)          (Microservices)           (Workflows) ✅             (Testing + Logging)         (Cloud Deploy)
```

### Completed Phases

| Phase | Status | Goal | Key Tech |
|-------|--------|------|----------|
| **1** | ✅ | API aggregator with hexagonal architecture | NestJS + 3 external APIs |
| **2** | ✅ | Add payment service with chaos engineering | Fake Stripe + Chaos Engine |
| **3** | ✅ | Workflow orchestration with durability | Temporal + Activities + Saga |
| **4** | 🔜 | Production observability | Pino + E2E tests + Metrics |
| **5** | 📋 | Cloud deployment | Kubernetes + CI/CD |

## What's Built

### Phase 1: Founder Service (Port 3000)
Production-ready API aggregator with hexagonal architecture.

**Features:**
- Hexagonal architecture (Domain/Application/Infrastructure/Presentation)
- NestJS + Strategy Pattern (3 concurrency strategies)
- HttpService with interceptors (logging, retry, correlation ID)
- Swagger/OpenAPI documentation

**Endpoints:**
- `GET /api/v1/user-context?strategy=promise-allsettled`
- `GET /health`

### Phase 2: Fake Stripe Chaos (Port 3001)
Chaos engineering payment service for resilience testing.

**Features:**
- Chaos Engine (40% success, 30% timeout, 20% error500, 10% error402)
- Statistics tracking + request history
- Correlation ID support

**Endpoints:**
- `POST /payment/charge`
- `GET /payment/stats`

### Phase 3: Temporal Orchestration (Ports 3002, 7233, 8080)
Durable workflow orchestration with automatic retry and Saga pattern.

**Components:**
- **Temporal Server** (7233) - Workflow orchestration engine
- **Temporal UI** (8080) - Workflow visibility
- **Temporal Worker** - Executes workflows and activities
- **Temporal API** (3002) - REST API for workflow management
- **PostgreSQL** (5432) - Temporal persistence

**Features:**
- Durable execution (survives crashes)
- Automatic retry with exponential backoff
- Saga pattern for payment compensation
- Signals for workflow cancellation
- Queries for real-time progress tracking
- Full workflow history in Temporal UI

**Workflows:**
- `userContextWorkflow` - Aggregate location, weather, cat fact (parallel/sequential)
- `paymentWorkflow` - Process payment with Saga compensation

**Temporal API Endpoints:**
- `POST /api/v1/workflows/user-context`
- `POST /api/v1/workflows/payment`
- `GET /api/v1/workflows/:id/status`
- `GET /api/v1/workflows/:id/progress`
- `GET /api/v1/workflows/:id/result`
- `POST /api/v1/workflows/:id/cancel`
- `GET /api/v1/workflows/:id/history`

## Tech Stack

- **TypeScript** - Type-safe development
- **NestJS** - Microservices framework
- **Temporal** - Workflow orchestration
- **Docker** - Containerization
- **PostgreSQL** - Temporal persistence
- **Axios** - HTTP client
- **RxJS** - Reactive programming
- **Swagger/OpenAPI** - API documentation

## Prerequisites

- Node.js >= 20.0.0
- Docker and Docker Compose
- Task (optional but recommended): https://taskfile.dev/installation/
- jq (optional, for JSON formatting): `brew install jq`
- VS Code with REST Client extension (optional)

## Monorepo Structure

```
fake-stripe/
├── packages/
│   ├── founder/                    # Phase 1: User context aggregator
│   ├── fake-stripe-chaos/          # Phase 2: Payment with chaos
│   ├── temporal-worker/            # Phase 3: Temporal Worker
│   └── temporal-api/               # Phase 3: Temporal REST API
├── docs/
│   ├── TEMPORAL_ARCHITECTURE.md    # Complete architecture guide
│   └── TESTING_GUIDE.md            # Comprehensive testing guide
├── docker-compose.yml              # All services orchestration
├── Taskfile.yml                    # Task commands
├── TASKFILE_README.md              # Task usage guide
├── QUICKREF.md                     # Quick reference
├── PHASE3_SUMMARY.md               # Phase 3 implementation summary
├── CLAUDE.md                       # Project guidance
└── README.md                       # This file
```

## Development Workflow

### 1. Start Services

```bash
# Using Task (recommended)
task up

# Or using Docker Compose
docker-compose up -d
```

### 2. Verify Health

```bash
# Using Task
task health

# Or manually
curl http://localhost:3002/health
curl http://localhost:3000/health
curl http://localhost:3001/payment/stats
```

### 3. Test Workflows

```bash
# Using Task
task test:workflow              # Parallel strategy
task test:workflow:sequential   # Sequential strategy
task test:payment              # Payment workflow

# Or using curl (see packages/temporal-api/requests.http)
```

### 4. Monitor in Temporal UI

```bash
# Using Task
task ui

# Or manually
open http://localhost:8080
```

### 5. View Logs

```bash
# Using Task
task logs:temporal-worker
task logs:temporal-api
task logs:founder

# Or using Docker Compose
docker-compose logs -f temporal-worker
```

## Common Tasks

### Development

```bash
task install                  # Install all dependencies
task dev:temporal-worker      # Run Worker locally
task dev:temporal-api         # Run API locally
task build                    # Build all packages
```

### Testing

```bash
task test:workflow            # Test user context workflow
task test:payment             # Test payment workflow
task health                   # Check all services
```

### Workflow Management

```bash
# Get workflow status
task workflow:status -- user-context-abc123

# Get workflow progress
task workflow:progress -- user-context-abc123

# Get workflow result
task workflow:result -- user-context-abc123

# Cancel workflow
task workflow:cancel -- user-context-abc123
```

### Monitoring

```bash
task stats                    # View Fake Stripe chaos stats
task logs:temporal-worker     # View Worker logs
task ui                       # Open Temporal UI
```

### Cleanup

```bash
task down                     # Stop all services
task clean                    # Remove build artifacts
task clean:docker             # Remove Docker volumes
task reset                    # Full reset
```

## Architecture Evolution

### Phase 1: Simple Aggregator
```
Client → Founder (NestJS) → [IPApi, Weather, CatFact]
         └─ Manual retry via HttpRetryInterceptor
```

### Phase 2: Microservices
```
Client → Founder → External APIs
              ↓
         Fake Stripe (chaos)
```

### Phase 3: Temporal Orchestration ✅
```
Client → Temporal API (REST)
              ↓
         Temporal Server
              ↓
         Temporal Worker (Activities)
              ↓
         [External APIs, Fake Stripe]
```

**Benefits:**
- Durable execution (survives crashes)
- Automatic retry with backoff
- Saga pattern for compensations
- Full workflow history
- Real-time progress tracking

## External APIs Used

| API | Purpose | Authentication | Phase |
|-----|---------|----------------|-------|
| [IPApi](https://ipapi.co/) | Geolocation | None | 1 |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather data | API Key | 1 |
| [Cat Facts](https://catfact.ninja/) | Entertainment | None | 1 |
| Fake Stripe | Payment simulation | Internal | 2 |

## Testing

### Manual Testing

Use the REST Client extension in VS Code:

1. Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Open `packages/temporal-api/requests.http`
3. Click "Send Request" above each request

### Automated Testing

```bash
# Test workflows
task test:workflow
task test:workflow:sequential
task test:payment

# Check service health
task health

# View workflow in UI
task ui
```

See [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) for comprehensive testing scenarios.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project guidance
- **[TASKFILE_README.md](./TASKFILE_README.md)** - Task commands guide
- **[QUICKREF.md](./QUICKREF.md)** - Quick reference
- **[PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md)** - Phase 3 implementation summary
- **[docs/TEMPORAL_ARCHITECTURE.md](./docs/TEMPORAL_ARCHITECTURE.md)** - Complete architecture
- **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Testing guide
- **packages/*/README.md** - Individual service documentation

## Learning Objectives

By exploring this project, you'll learn:

1. **Hexagonal Architecture** - Clean separation of domain, application, and infrastructure
2. **Concurrency Patterns** - Promise.allSettled, RxJS, async/await strategies
3. **Chaos Engineering** - Controlled failure simulation and resilience
4. **Microservices** - HTTP communication, service boundaries, retry logic
5. **Temporal Workflows** - Durable execution, activities, signals, queries
6. **Saga Pattern** - Distributed transactions with compensations
7. **Observability** - Structured logging, correlation IDs, distributed tracing

## Key Patterns Demonstrated

### 1. Hexagonal Architecture (Ports & Adapters)
```typescript
Domain (pure logic)
  ↓ uses
Ports (interfaces)
  ↓ implemented by
Adapters (external integrations)
```

### 2. Strategy Pattern
```typescript
// Choose execution strategy at runtime
strategy: 'parallel' | 'sequential'
```

### 3. Saga Pattern
```typescript
try {
  await processPayment()
} catch (error) {
  await compensatePayment()  // Rollback
}
```

### 4. Retry with Exponential Backoff
```typescript
retry: {
  initialInterval: '1s',
  backoffCoefficient: 2,
  maximumAttempts: 3
}
```

### 5. Partial Failure Handling
```typescript
// Return null for failed services, continue with others
return {
  location: loc || null,
  weather: weather || null,
  catFact: catFact || null
}
```

## Troubleshooting

### Services not starting
```bash
# Check Docker
docker ps

# View logs
task logs

# Restart services
task restart
```

### Workflow stuck
```bash
# Check Worker logs
task logs:temporal-worker

# View in Temporal UI
task ui

# Cancel workflow
task workflow:cancel -- {workflowId}
```

### Database issues
```bash
# Reset database (WARNING: destroys workflow history)
task db:reset
```

See [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md#troubleshooting) for more.

## Next Steps (Future Phases)

### Phase 4: Production Observability
- E2E automated tests (Jest + Supertest)
- Structured logging with Pino
- Prometheus metrics
- Grafana dashboards
- Distributed tracing

### Phase 5: Cloud Deployment
- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Production-ready configuration
- Auto-scaling
- Monitoring & alerting

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Chaos Engineering](https://principlesofchaos.org/)
- [Task Documentation](https://taskfile.dev/)

## Contributing

This is a learning project. Feel free to:
- Explore the code and architecture
- Run the services and test workflows
- Read the documentation
- Suggest improvements

## License

MIT - Learning and educational purposes
