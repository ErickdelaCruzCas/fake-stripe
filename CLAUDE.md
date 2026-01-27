# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 PROJECT STATUS - READ THIS FIRST

### Current Phase: **PHASE 2 - COMPLETE ✅**
### Next Phase: **PHASE 3 - Temporal Orchestration** 🔜

**Architecture Evolution Plan:**
Este proyecto sigue un plan evolutivo de 5 fases (0-4) desde un agregador simple hasta microservicios orquestados por Temporal.
Ver plan completo en: `/Users/erickdelacruz/.claude/plans/hazy-leaping-lighthouse.md`

---

## ✅ COMPLETED PHASES

### **Fase 0: Limpieza** ✅ COMPLETE
- Monorepo structure created (`packages/`)
- Old Temporal files removed
- `requests.http` base created
- Documentation updated

### **Fase 1: Founder - Agregador con Arquitectura Hexagonal** ✅ COMPLETE

### ✅ What's Done (Phase 1):

**Core Architecture:**
- ✅ Hexagonal architecture (Domain, Application, Infrastructure, Presentation)
- ✅ NestJS application with REST API (puerto 3000)
- ✅ 3 external API adapters working:
  - IPApi (location) - `https://ipapi.co/json`
  - OpenWeatherMap (weather) - `https://api.openweathermap.org` ✅ **FIXED: Auth bug & query param**
  - CatFact (entertainment) - `https://catfact.ninja/fact`
- ✅ Strategy Pattern for concurrency (3 strategies):
  - Promise.allSettled() - Parallel with fault tolerance
  - RxJS - Reactive programming with observables
  - Async Sequential - Sequential for comparison
- ✅ Endpoint `/api/v1/user-context` with `?strategy=` query parameter
- ✅ Partial failure handling (returns null fields instead of failing completely)

**Documentation & API:**
- ✅ Swagger/OpenAPI documentation at `/api/docs`
- ✅ OpenAPI spec export to `openapi.json` and `openapi.yml`
- ✅ TypeScript client generation from OpenAPI spec
- ✅ Generated client in `packages/generated-clients/founder/`
- ✅ Usage examples in `USAGE_EXAMPLE.ts`

**Best Practices & Architecture Improvements:** ⭐ **NEW**
- ✅ **HttpService migration** - Replaced `axios` direct calls with `@nestjs/axios`
- ✅ **HTTP Interceptors** - Centralized cross-cutting concerns:
  - `HttpLoggingInterceptor` - Automatic logging of all HTTP requests
  - `HttpRetryInterceptor` - Intelligent retry with exponential backoff (3 retries, 1s/2s/4s)
- ✅ **Single Responsibility Principle** - Each interceptor has one job
- ✅ **Dependency Injection** - All adapters use DI for testability
- ✅ **Global configuration** - Timeout and retry policies centralized in `HttpModule`
- ✅ Documentation: `docs/HTTPSERVICE_MIGRATION.md`

**Testing & Observability:**
- ✅ Structured logging with context
- ✅ Error handling with proper HTTP status codes
- ✅ Docker setup ready

**Correlation ID & Observability:** ⭐ **COMPLETE**
- ✅ **CorrelationIdMiddleware** - Generates/extracts correlation IDs for distributed tracing
- ✅ **RequestLoggerMiddleware** - Logs all HTTP requests with correlation ID
- ✅ **Correlation ID propagation** - All adapters propagate correlation ID to external APIs
- ✅ **Structured JSON logging** - All logs in JSON format with correlation ID
- ✅ **TypeScript types** - Extended Express Request type for correlationId
- ✅ Documentation: `docs/CORRELATION_ID.md`

**Status:** ✅ **FASE 1 COMPLETADA AL 100%** - Production-ready API aggregator with professional architecture

---

### **Fase 2: Fake Stripe + Chaos Engineering** ✅ COMPLETE

**Service Created:**
- ✅ Complete NestJS microservice on port 3001
- ✅ **Chaos Engine** - Simulates realistic payment failures:
  - 40% Success (HTTP 200)
  - 30% Timeout (HTTP 408) - 5 second delay
  - 20% Internal Error (HTTP 500)
  - 10% Insufficient Funds (HTTP 402)
- ✅ **Payment Service** - Processes charges with chaos engineering
- ✅ **Stats Service** - Tracks distribution of scenarios
- ✅ **Correlation ID support** - Full tracing integration

**API Endpoints:**
- ✅ `POST /payment/charge` - Process payment with chaos
- ✅ `GET /payment/stats` - View aggregated statistics
- ✅ `GET /payment/stats/recent` - Recent requests history
- ✅ `POST /payment/stats/reset` - Reset statistics

**Documentation:**
- ✅ Swagger/OpenAPI at `http://localhost:3001/api/docs`
- ✅ Complete README: `packages/fake-stripe-chaos/README.md`
- ✅ Testing guide with `requests.http` in service root
- ✅ Architecture documentation

**Docker Setup:**
- ✅ `docker-compose.yml` updated with both services
- ✅ Network configuration for service communication
- ✅ Health checks configured
- ✅ Multi-stage Dockerfile for Fake Stripe

**Testing:**
- ✅ `packages/fake-stripe-chaos/requests.http` - 40+ test scenarios
- ✅ Validation error examples
- ✅ Performance testing examples
- ✅ Workflow testing (reset → execute → verify)

**Status:** ✅ **FASE 2 COMPLETADA AL 100%** - Chaos payment service ready for resilience testing

---

### 🔨 Session Summary (Latest Work):

**Session 1: Fase 1 - Foundation & Best Practices**

1. **OpenWeatherMap API Fix:**
   - Fixed 401 auth error (config key bug)
   - Fixed query param (`key` → `appid`)
   - Status: ✅ Working with API key `904c250dea7da952f578aad2312c65e5`

2. **HttpService Migration:**
   - Migrated all 3 adapters from `axios` to `@nestjs/axios` HttpService
   - Created `HttpLoggingInterceptor` - automatic logging of all HTTP calls
   - Created `HttpRetryInterceptor` - smart retry with exponential backoff
   - Benefits: centralized logging, testability, global config
   - Documentation: `docs/HTTPSERVICE_MIGRATION.md`

3. **Correlation ID Implementation:**
   - Created `CorrelationIdMiddleware` - generates/extracts correlation IDs
   - Created `RequestLoggerMiddleware` - logs HTTP requests with correlation ID
   - Updated all 3 adapters to propagate correlation ID to external APIs
   - Extended Express Request type with `correlationId` field
   - All logs now in structured JSON format with correlation ID
   - Documentation: `docs/CORRELATION_ID.md`
   - Updated `requests.http` with correlation ID examples

**Session 2: Fase 2 - Chaos Engineering Service**

4. **Fake Stripe Service Created:**
   - Complete microservice on port 3001
   - Chaos Engine with configurable failure distribution
   - Payment Service with chaos integration
   - Stats Service for tracking distribution
   - Full Swagger/OpenAPI documentation

5. **Chaos Scenarios Implemented:**
   - 40% Success (200 OK)
   - 30% Timeout (408) with 5s delay
   - 20% Internal Error (500)
   - 10% Insufficient Funds (402)
   - All scenarios with proper error messages

6. **Infrastructure:**
   - Docker Compose updated with both services
   - Network configuration for inter-service communication
   - Health checks for both services
   - Dockerfiles with multi-stage builds

7. **Testing & Documentation:**
   - `packages/fake-stripe-chaos/requests.http` with 40+ test scenarios
   - Complete README with usage guide
   - Integration examples
   - Performance testing workflows
   - Root `requests.http` updated with Fake Stripe endpoints

---

## 🔜 NEXT PHASE: Fase 3 - Temporal Orchestration

### Goal
Convert Founder service into Temporal Worker and implement durable workflow orchestration.

### What to Implement

**1. Temporal Infrastructure:**
- [ ] Add Temporal Server to `docker-compose.yml`
- [ ] Add PostgreSQL for Temporal persistence
- [ ] Add Temporal UI (port 8080)
- [ ] Create Temporal Worker process

**2. Migrate Founder to Temporal:**
- [ ] Convert adapters to Temporal Activities:
  - `getCurrentLocation()` activity
  - `getWeatherByCoordinates()` activity
  - `getRandomCatFact()` activity
- [ ] Create `userContextWorkflow` - orchestrates all activities
- [ ] Implement retry policies in workflow (replace HttpRetryInterceptor)
- [ ] Add Temporal Signals for cancellation
- [ ] Add Temporal Queries for progress tracking

**3. Payment Integration:**
- [ ] Create `paymentActivity` calling Fake Stripe
- [ ] Implement Saga pattern for payment workflow:
  - Execute payment
  - Handle failures with compensations
  - Don't retry 402 errors (insufficient funds)
  - Retry 408/500 errors automatically
- [ ] Child workflow for notifications

**4. API Layer:**
- [ ] Temporal Client API (port 3002)
- [ ] `POST /workflows/user-context` - Start workflow
- [ ] `GET /workflows/:id/status` - Query workflow status
- [ ] `GET /workflows/:id/progress` - Real-time progress
- [ ] `POST /workflows/:id/cancel` - Cancel workflow

**5. Advanced Features:**
- [ ] Signals for workflow control
- [ ] Queries for real-time state
- [ ] Child workflows
- [ ] Saga pattern with compensations
- [ ] Continue-as-new for long-running workflows

**Key Benefits of Temporal:**
- Automatic retry with exponential backoff (better than manual)
- Durable execution (survives crashes)
- Saga pattern for distributed transactions
- Visibility into workflow history
- Easy debugging with Temporal UI

**Architecture Change:**
```
BEFORE (Fase 1-2):
Client → Founder → [External APIs + Fake Stripe]
         └─ Manual retry logic

AFTER (Fase 3):
Client → Temporal API → Temporal Server → Worker
                                           └─ Activities [External APIs + Fake Stripe]
         └─ Automatic retry
         └─ Durable execution
         └─ Saga compensations
```

---

### 📁 Files Created/Modified (All Phases):

**Fase 1: Founder Service**

Core Structure:
- `packages/founder/src/main.ts` - NestJS bootstrap with Swagger
- `packages/founder/src/app.module.ts` - Module with HttpModule + interceptors + middlewares
- `packages/founder/package.json` - Dependencies + OpenAPI scripts

Domain Layer:
- `domain/models/` - Location, Weather, CatFact, UserContext
- `domain/ports/` - LocationPort, WeatherPort, CatFactPort, AggregationStrategy
- `domain/services/user-context.service.ts` - Business logic
- `domain/ports/` - LocationPort, WeatherPort, CatFactPort, AggregationStrategy
- `domain/services/user-context.service.ts`

Infrastructure Layer:
- `infrastructure/adapters/ipapi.adapter.ts` - IPApi integration with HttpService
- `infrastructure/adapters/openweathermap.adapter.ts` - OpenWeatherMap integration
- `infrastructure/adapters/catfact.adapter.ts` - CatFact integration
- `infrastructure/strategies/promise-allsettled.strategy.ts` - Parallel with fault tolerance
- `infrastructure/strategies/rxjs.strategy.ts` - RxJS observables
- `infrastructure/strategies/async-sequential.strategy.ts` - Sequential execution
- `infrastructure/interceptors/http-logging.interceptor.ts` - HTTP logging
- `infrastructure/interceptors/http-retry.interceptor.ts` - Retry with backoff
- `infrastructure/middleware/correlation-id.middleware.ts` - Correlation ID generation
- `infrastructure/middleware/request-logger.middleware.ts` - Request logging

Presentation Layer:
- `presentation/controllers/user-context.controller.ts` - Main API controller
- `presentation/controllers/health.controller.ts` - Health check

Documentation:
- `packages/founder/README.md` - Complete service documentation
- `packages/founder/docs/HTTPSERVICE_MIGRATION.md` - HttpService architecture
- `packages/founder/docs/CORRELATION_ID.md` - Distributed tracing guide
- `packages/founder/openapi.json` - Generated OpenAPI spec (JSON)
- `packages/founder/openapi.yml` - Generated OpenAPI spec (YAML)

Generated Client:
- `packages/generated-clients/founder/` - TypeScript client
- `packages/generated-clients/founder/USAGE_EXAMPLE.ts` - Usage examples

Types:
- `packages/founder/src/types/express.d.ts` - Extended Request type

---

**Fase 2: Fake Stripe Chaos Service**

Core Structure:
- `packages/fake-stripe-chaos/src/main.ts` - NestJS bootstrap
- `packages/fake-stripe-chaos/src/app.module.ts` - Main module
- `packages/fake-stripe-chaos/package.json` - Dependencies
- `packages/fake-stripe-chaos/tsconfig.json` - TypeScript config
- `packages/fake-stripe-chaos/Dockerfile` - Multi-stage build

Chaos Engineering:
- `chaos/chaos-engine.service.ts` - Core chaos logic with probability distribution

Payment:
- `payment/payment.service.ts` - Payment processing with chaos
- `payment/payment.controller.ts` - Payment endpoints
- `payment/dto/charge.dto.ts` - Charge request DTO
- `payment/dto/charge-response.dto.ts` - Response DTOs

Statistics:
- `stats/stats.service.ts` - Request tracking and aggregation
- `stats/stats.controller.ts` - Statistics endpoints

Middleware:
- `middleware/correlation-id.middleware.ts` - Correlation ID support

Types:
- `types/express.d.ts` - Extended Request type

Documentation:
- `packages/fake-stripe-chaos/README.md` - Complete service guide
- `packages/fake-stripe-chaos/requests.http` - 40+ test scenarios

---

**Infrastructure (Root Level)**

- `docker-compose.yml` - Both services + networking + health checks
- `requests.http` - REST Client for both services (Founder + Fake Stripe)
- `CLAUDE.md` - This file (updated with all progress)

---

## 🎯 How to Continue (Next Session)

### Quick Start Commands

```bash
# Terminal 1: Start Fake Stripe
cd packages/fake-stripe-chaos
npm run dev

# Terminal 2: Start Founder
cd packages/founder
npm run dev

# Terminal 3: Test with REST Client
# Open requests.http in VS Code
# Or use packages/fake-stripe-chaos/requests.http

# Docker (both services)
docker-compose up -d
```

### Next Steps for Fase 3

1. **Read the plan** in `/Users/erickdelacruz/.claude/plans/hazy-leaping-lighthouse.md`
2. **Review Fase 3 requirements** in this file (section above)
3. **Start with Temporal infrastructure**:
   - Add Temporal Server to docker-compose.yml
   - Add PostgreSQL for persistence
   - Add Temporal UI
4. **Convert Founder to Worker**:
   - Migrate adapters → activities
   - Create workflows
   - Implement retry policies
5. **Test end-to-end** with Temporal UI

### What's Working Now

✅ **Founder Service (Port 3000)**:
- `/api/v1/user-context?strategy=promise-allsettled` - Aggregates 3 APIs
- `/health` - Health check
- `/api/docs` - Swagger UI
- Correlation ID in all requests
- Structured JSON logging
- Automatic retry on 5xx errors

✅ **Fake Stripe Chaos (Port 3001)**:
- `/payment/charge` - Process payment (40% success, 30% timeout, 20% error500, 10% error402)
- `/payment/stats` - View distribution
- `/payment/stats/recent` - Recent requests
- `/payment/stats/reset` - Reset stats
- `/api/docs` - Swagger UI
- Full correlation ID support

### Key Learnings Applied

- ✅ Hexagonal Architecture (Domain/Application/Infrastructure/Presentation)
- ✅ SOLID Principles (SRP, DIP especially)
- ✅ Strategy Pattern (multiple concurrency strategies)
- ✅ Dependency Injection (all services mockeable)
- ✅ HttpService > axios (interceptors, retry, logging)
- ✅ Correlation ID for distributed tracing
- ✅ Chaos Engineering for resilience testing
- ✅ Structured JSON logging
- ✅ OpenAPI/Swagger documentation
- ✅ Docker multi-stage builds
- ✅ Health checks in containers

---

## Working Guidelines

- Approach this codebase as a senior software engineer
- Always answer concisely
- Assume production-grade systems - use best practices, proper error handling, logging, and maintainability
- Keep README.md always updated with any changes to setup, architecture, or usage
- This is a learning project - prioritize clean code, proper patterns, and educational value
- **Follow SOLID principles** - especially Single Responsibility and Dependency Inversion
- **Prefer composition over inheritance**
- **Use dependency injection** - everything should be testable

## Project Overview

This is a TypeScript-based learning project that **evolves** from a simple API aggregator to a full microservices architecture with Temporal orchestration. The project demonstrates professional software engineering practices with progressive complexity.

**Current Goal (Phase 1):** Build a production-grade API aggregator (Founder service) that combines data from 3 external APIs with hexagonal architecture and multiple concurrency strategies.

**Tech Stack:**
- TypeScript (strict mode)
- NestJS (microservice framework)
- @nestjs/axios + RxJS (HTTP client with interceptors)
- Swagger/OpenAPI (API documentation + client generation)
- Docker (future: Temporal Server + PostgreSQL)

## Development Commands

```bash
# Navigate to Founder service
cd packages/founder

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start NestJS API server (development with hot reload)
npm run dev

# Export OpenAPI specification
npm run openapi:export

# Generate TypeScript client from OpenAPI spec
npm run openapi:generate-client

# Test API with REST Client
# Open requests.http in VS Code and click "Send Request"
```

## Architecture Overview

### Hexagonal Architecture (Ports & Adapters)

This project follows **hexagonal architecture** to separate business logic from infrastructure concerns.

```
packages/founder/
├── domain/                  # Core business logic (no framework dependencies)
│   ├── models/             # Domain entities (Location, Weather, CatFact, UserContext)
│   ├── ports/              # Interfaces (contracts) for external dependencies
│   │   ├── location.port.ts
│   │   ├── weather.port.ts
│   │   ├── cat-fact.port.ts
│   │   └── aggregation-strategy.port.ts
│   └── services/           # Business logic (uses ports, not adapters)
│       └── user-context.service.ts
│
├── application/            # Use cases & DTOs
│   ├── use-cases/
│   └── dto/                # Data transfer objects with @ApiProperty decorators
│
├── infrastructure/         # External dependencies (implements ports)
│   ├── adapters/           # External API integrations (implements ports)
│   │   ├── ipapi.adapter.ts           # LocationPort implementation
│   │   ├── openweathermap.adapter.ts  # WeatherPort implementation
│   │   └── catfact.adapter.ts         # CatFactPort implementation
│   ├── strategies/         # Concurrency strategy implementations
│   │   ├── promise-allsettled.strategy.ts
│   │   ├── rxjs.strategy.ts
│   │   └── async-sequential.strategy.ts
│   └── interceptors/       # HTTP interceptors (cross-cutting concerns)
│       ├── http-logging.interceptor.ts
│       └── http-retry.interceptor.ts
│
└── presentation/           # API layer (controllers)
    └── controllers/
        ├── user-context.controller.ts
        └── health.controller.ts
```

**Key Principles:**
- **Domain** = Pure business logic, no framework dependencies
- **Ports** = Interfaces (contracts) defining what the domain needs
- **Adapters** = Concrete implementations of ports (external APIs, databases, etc.)
- **Presentation** = REST controllers (thin layer, delegates to domain)

### Strategy Pattern (Concurrency Strategies)

The project implements **Strategy Pattern** for different aggregation approaches:

1. **Promise.allSettled()** - Parallel with fault tolerance (default)
   - Executes all API calls in parallel
   - Returns partial results even if some fail
   - Best for production use

2. **RxJS** - Reactive programming with observables
   - Uses `forkJoin` for parallel execution
   - Demonstrates RxJS operators
   - Good for complex async flows

3. **Async Sequential** - No parallelism (for comparison)
   - Calls APIs one by one
   - Slower but easier to debug
   - Educational: shows performance difference

Users can choose strategy via:
- Query parameter: `GET /api/v1/user-context?strategy=rxjs`
- Environment variable: `AGGREGATION_STRATEGY=promise-allsettled`

### HTTP Client Architecture ⭐ **IMPORTANT**

**DO NOT use `axios` directly. Always use `@nestjs/axios` HttpService.**

**Why HttpService > axios:**
1. ✅ **Centralized logging** - HttpLoggingInterceptor logs all requests automatically
2. ✅ **Automatic retry** - HttpRetryInterceptor handles transient failures (3 retries, exponential backoff)
3. ✅ **Testability** - Easy to mock via DI container
4. ✅ **Global configuration** - Timeout, headers, etc. in one place
5. ✅ **Correlation ID propagation** - Future: automatic tracing
6. ✅ **Circuit breaker** - Future: fail fast when service is down

**Interceptors Implemented:**
- **HttpLoggingInterceptor**: Logs method, URL, status, duration, correlationId
- **HttpRetryInterceptor**: Retries 5xx errors only (not 4xx), exponential backoff 1s/2s/4s

See `docs/HTTPSERVICE_MIGRATION.md` for detailed comparison and examples.

## Key Considerations

### SOLID Principles Applied

**Single Responsibility Principle (SRP):**
- Each adapter handles ONE external API
- Each interceptor handles ONE cross-cutting concern (logging OR retry)
- Each strategy implements ONE aggregation approach

**Open/Closed Principle (OCP):**
- Add new strategies without modifying existing code
- Add new interceptors without changing adapters

**Liskov Substitution Principle (LSP):**
- Any `AggregationStrategy` can be swapped at runtime
- Any `LocationPort` implementation is interchangeable

**Interface Segregation Principle (ISP):**
- Ports are small and focused (LocationPort, WeatherPort, etc.)
- No fat interfaces

**Dependency Inversion Principle (DIP):**
- Domain depends on **ports** (interfaces), not concrete adapters
- Adapters are injected via NestJS DI container

### Best Practices

**Error Handling:**
- Try-catch in adapters with proper HTTP status codes
- Partial failures return null fields instead of throwing
- RxJS catchError for observable streams
- Global exception filters (future)

**Configuration:**
- Environment variables via `@nestjs/config`
- Typed configuration (future)
- `.env.example` with all required vars

**API Documentation:**
- Swagger decorators on all controllers (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
- DTOs with `@ApiProperty` for auto-generated docs
- OpenAPI spec exported to `openapi.json` and `openapi.yml`
- TypeScript client generated from spec

**Testing (Future):**
- Unit tests: Mock ports in domain services
- Integration tests: Test adapters with real APIs
- E2E tests: Test full request flow

## Configuration

Environment variables in `packages/founder/.env`:

```bash
NODE_ENV=development
PORT=3000

# OpenWeatherMap API Key
OPENWEATHER_API_KEY=904c250dea7da952f578aad2312c65e5

# Aggregation Strategy (default if not specified via query param)
# Options: promise-allsettled | rxjs | async-sequential
AGGREGATION_STRATEGY=promise-allsettled
```

## Quick Reference

**Start Founder service:**
```bash
cd packages/founder
npm install
npm run dev
```

**Test endpoints:**
```bash
# Health check
curl http://localhost:3000/health

# User context (default strategy)
curl http://localhost:3000/api/v1/user-context

# User context with specific strategy
curl http://localhost:3000/api/v1/user-context?strategy=rxjs

# View Swagger docs
open http://localhost:3000/api/docs
```

**Using REST Client (recommended):**
1. Install VS Code extension: REST Client (`humao.rest-client`)
2. Open `requests.http` in project root
3. Click "Send Request" above each `###` separator
4. View responses in VS Code panel

**Export OpenAPI spec:**
```bash
cd packages/founder
npm run openapi:export  # Creates openapi.json and openapi.yml
```

**Generate TypeScript client:**
```bash
cd packages/founder
npm run openapi:generate-client
# Client generated in packages/generated-clients/founder/
# See USAGE_EXAMPLE.ts for examples
```

## Common Patterns

### Adding a New External API Adapter

1. **Create port interface** in `domain/ports/`:
```typescript
export interface MyApiPort {
  getData(id: string): Promise<MyData>;
}
```

2. **Create adapter** in `infrastructure/adapters/`:
```typescript
@Injectable()
export class MyApiAdapter implements MyApiPort {
  constructor(private readonly httpService: HttpService) {}

  async getData(id: string): Promise<MyData> {
    const response = await firstValueFrom(
      this.httpService.get(`https://api.example.com/data/${id}`).pipe(
        catchError((error: AxiosError) => {
          throw new HttpException('API error', HttpStatus.BAD_GATEWAY);
        })
      )
    );
    return MyData.fromApiResponse(response.data);
  }
}
```

3. **Register in AppModule**:
```typescript
{
  provide: 'MyApiPort',
  useClass: MyApiAdapter,
}
```

4. **Inject in service**:
```typescript
constructor(@Inject('MyApiPort') private myApi: MyApiPort) {}
```

### Adding a New HTTP Interceptor

1. **Create interceptor** in `infrastructure/interceptors/`:
```typescript
@Injectable()
export class MyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => console.log('After...'))
    );
  }
}
```

2. **Register globally** in `AppModule`:
```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: MyInterceptor,
}
```

## Architecture Decision Records (ADRs)

Important architectural decisions are documented in `packages/founder/docs/`:

- **HTTPSERVICE_MIGRATION.md** - Why HttpService > axios (logging, retry, testing)

Future ADRs:
- Correlation ID propagation strategy
- Circuit breaker implementation
- Structured logging with Pino
- Testing strategy (unit vs integration vs E2E)
