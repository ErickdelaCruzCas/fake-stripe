# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 PROJECT STATUS

**Current Phase:** PHASE 3 - COMPLETE ✅
**Next Phase:** PHASE 4 - Advanced Patterns 🔜

**Architecture Evolution:**
Progressive TypeScript project evolving from API aggregator → Temporal-orchestrated microservices (5 phases).
Plan: `/Users/erickdelacruz/.claude/plans/hazy-leaping-lighthouse.md`

---

## ✅ WHAT'S BUILT

### Phase 1: Founder Service (Port 3000)
Production-ready API aggregator combining 3 external APIs with hexagonal architecture.

**Key Features:**
- Hexagonal architecture (Domain/Application/Infrastructure/Presentation)
- NestJS + Strategy Pattern (3 concurrency strategies)
- HttpService with interceptors (logging, retry, correlation ID)
- Swagger/OpenAPI docs + TypeScript client generation
- Full observability (structured JSON logging, correlation ID propagation)

**Endpoints:**
- `GET /api/v1/user-context?strategy=promise-allsettled` - Aggregate 3 APIs
- `GET /health` - Health check
- `GET /api/docs` - Swagger UI

### Phase 2: Fake Stripe Chaos (Port 3001)
Chaos engineering payment service for resilience testing.

**Features:**
- Chaos Engine (40% success, 30% timeout, 20% error500, 10% error402)
- Statistics tracking + recent request history
- Full correlation ID support

**Endpoints:**
- `POST /payment/charge` - Process payment with chaos
- `GET /payment/stats` - View distribution
- `POST /payment/stats/reset` - Reset stats
- `GET /api/docs` - Swagger UI

### Phase 3: Temporal Orchestration (Ports 3002, 7233, 8080)
Durable workflow orchestration with automatic retry and Saga pattern.

**Components:**
- **Temporal Server** (Port 7233) - Workflow orchestration engine
- **Temporal UI** (Port 8080) - Workflow visibility and debugging
- **Temporal Worker** - Executes workflows and activities
- **Temporal API** (Port 3002) - REST API for workflow management
- **PostgreSQL** (Port 5432) - Temporal persistence

**Key Features:**
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
- `POST /api/v1/workflows/user-context` - Start aggregation workflow
- `POST /api/v1/workflows/payment` - Start payment workflow
- `GET /api/v1/workflows/:id/status` - Query workflow status
- `GET /api/v1/workflows/:id/progress` - Real-time progress
- `GET /api/v1/workflows/:id/result` - Get result (waits for completion)
- `POST /api/v1/workflows/:id/cancel` - Cancel workflow
- `GET /api/v1/workflows/:id/history` - Execution history
- `GET /health` - Health check
- `GET /api/docs` - Swagger UI

---

## ⚡ QUICK START

```bash
# Start all services with Docker (recommended)
docker-compose up -d

# Or start services individually
cd packages/founder && npm run dev           # Port 3000
cd packages/fake-stripe-chaos && npm run dev  # Port 3001
cd packages/temporal-worker && npm run dev   # Temporal Worker
cd packages/temporal-api && npm run dev      # Port 3002

# Access services
open http://localhost:3000/api/docs          # Founder API
open http://localhost:3001/api/docs          # Fake Stripe API
open http://localhost:3002/api/docs          # Temporal API
open http://localhost:8080                   # Temporal UI

# Test
# Open requests.http or packages/temporal-api/requests.http in VS Code
# Install "REST Client" extension to use
```

**Important Files:**
- `packages/founder/README.md` - Founder service documentation
- `packages/fake-stripe-chaos/README.md` - Chaos service guide
- `packages/temporal-worker/README.md` - Temporal Worker guide
- `packages/temporal-api/README.md` - Temporal API documentation
- `docs/TEMPORAL_ARCHITECTURE.md` - Complete Temporal architecture guide
- `requests.http` - API test collection (Founder + Fake Stripe)
- `packages/temporal-api/requests.http` - Temporal API test collection

---

## 💡 WORKING GUIDELINES

**Code Quality:**
- Approach as a senior software engineer
- Production-grade systems: proper error handling, logging, maintainability
- Prioritize clean code, proper patterns, educational value
- Always answer concisely

**Architecture Principles:**
- **SOLID Principles** - especially SRP and DIP
- **Hexagonal Architecture** - Domain isolated from infrastructure
- **Dependency Injection** - everything testable
- **Composition over inheritance**

**Functional Programming:**
- **Favor pure functions** - no side effects whenever possible
- **Prefer immutability** - use `const`, `readonly`, immutable structures
- **Deterministic functions** - same input = same output
- **Isolate side effects** - I/O, DB, mutations only in infrastructure/adapters

**Best Practices:**
- **HttpService > axios** - use `@nestjs/axios` for interceptors, retry, logging
- **Correlation ID** - propagate through all services for distributed tracing
- **Strategy Pattern** - swap implementations at runtime
- **Partial failures** - return null fields instead of failing completely
- **Structured logging** - JSON format with context

---

## 🏗️ ARCHITECTURE OVERVIEW

### Hexagonal Architecture (Ports & Adapters)

```
packages/founder/src/
├── domain/              # Pure business logic (no framework deps)
│   ├── models/          # Entities: Location, Weather, CatFact, UserContext
│   ├── ports/           # Interfaces: LocationPort, WeatherPort, CatFactPort
│   └── services/        # Business logic (uses ports, not adapters)
│
├── application/         # Use cases & DTOs
│   └── dto/             # Data transfer objects (@ApiProperty decorators)
│
├── infrastructure/      # External dependencies (implements ports)
│   ├── adapters/        # API integrations: IPApi, OpenWeatherMap, CatFact
│   ├── strategies/      # Concurrency: Promise.allSettled, RxJS, Sequential
│   ├── interceptors/    # HTTP: Logging, Retry, Correlation
│   └── middleware/      # Request: CorrelationId, Logger
│
└── presentation/        # API layer
    └── controllers/     # REST controllers: UserContext, Health
```

**Key Principles:**
- **Domain** = Pure logic, framework-agnostic
- **Ports** = Interfaces (contracts)
- **Adapters** = Concrete implementations (external APIs, DBs)
- **Presentation** = Thin controllers, delegate to domain

### Strategy Pattern

Three aggregation strategies (user-selectable via query param or env var):

1. **Promise.allSettled** (default) - Parallel with fault tolerance
2. **RxJS** - Reactive programming with observables
3. **Async Sequential** - Sequential execution (educational)

Usage: `GET /api/v1/user-context?strategy=rxjs`

### HTTP Client Architecture ⭐ CRITICAL

**Always use `@nestjs/axios` HttpService, NEVER raw `axios`.**

**Why:**
- ✅ Centralized logging (HttpLoggingInterceptor)
- ✅ Automatic retry (HttpRetryInterceptor - 3 retries, exponential backoff)
- ✅ Testability (DI mockable)
- ✅ Global config (timeout, headers)
- ✅ Correlation ID propagation

**Interceptors:**
- `HttpLoggingInterceptor` - Logs method, URL, status, duration, correlationId
- `HttpRetryInterceptor` - Retries 5xx only (not 4xx), backoff: 1s/2s/4s

See: `packages/founder/docs/HTTPSERVICE_MIGRATION.md`

---

## 🎯 SOLID PRINCIPLES APPLIED

**Single Responsibility (SRP):**
- One adapter per external API
- One interceptor per concern (logging OR retry)
- One strategy per aggregation approach

**Open/Closed (OCP):**
- Add strategies without modifying code
- Add interceptors without changing adapters

**Liskov Substitution (LSP):**
- Any `AggregationStrategy` swappable at runtime
- Any port implementation interchangeable

**Interface Segregation (ISP):**
- Small, focused ports (LocationPort, WeatherPort)

**Dependency Inversion (DIP):**
- Domain depends on ports (interfaces), not adapters
- Adapters injected via NestJS DI

---

## 🔧 COMMON PATTERNS

### Add External API Adapter

1. Create port in `domain/ports/`:
```typescript
export interface MyApiPort {
  getData(id: string): Promise<MyData>;
}
```

2. Create adapter in `infrastructure/adapters/`:
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

3. Register in `AppModule`:
```typescript
{ provide: 'MyApiPort', useClass: MyApiAdapter }
```

4. Inject in service:
```typescript
constructor(@Inject('MyApiPort') private myApi: MyApiPort) {}
```

### Add HTTP Interceptor

1. Create in `infrastructure/interceptors/`:
```typescript
@Injectable()
export class MyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(tap(() => console.log('After...')));
  }
}
```

2. Register globally in `AppModule`:
```typescript
{ provide: APP_INTERCEPTOR, useClass: MyInterceptor }
```

---

## 📝 CONFIGURATION

**Founder (.env):**
```bash
NODE_ENV=development
PORT=3000
OPENWEATHER_API_KEY=904c250dea7da952f578aad2312c65e5
AGGREGATION_STRATEGY=promise-allsettled  # or rxjs, async-sequential
```

See `.env.example` files in each package.

---

## 📚 TECH STACK

- **TypeScript** (strict mode)
- **NestJS** (microservices framework)
- **@nestjs/axios + RxJS** (HTTP client + reactive)
- **Swagger/OpenAPI** (docs + client generation)
- **Docker** (containerization)
- **Future:** Temporal (workflow orchestration)

---

## 🧪 DEVELOPMENT COMMANDS

```bash
# Founder service
cd packages/founder
npm install
npm run build              # Compile TypeScript
npm run dev                # Start with hot reload
npm run openapi:export     # Export OpenAPI spec
npm run openapi:generate-client  # Generate TS client

# Fake Stripe service
cd packages/fake-stripe-chaos
npm run dev                # Start chaos service

# Docker
docker-compose up -d       # Both services
docker-compose logs -f     # View logs
```

---

## 📖 ARCHITECTURE DECISIONS (ADRs)

Documented in `packages/founder/docs/`:
- **HTTPSERVICE_MIGRATION.md** - HttpService vs axios
- **CORRELATION_ID.md** - Distributed tracing strategy

**Future ADRs:**
- Circuit breaker implementation
- Structured logging with Pino
- Testing strategy (unit/integration/E2E)

---

## 🔍 KEY LEARNINGS

- ✅ Hexagonal Architecture separates business logic from infrastructure
- ✅ Strategy Pattern enables runtime behavior swapping
- ✅ HttpService interceptors centralize cross-cutting concerns
- ✅ Correlation IDs enable distributed tracing
- ✅ Chaos Engineering validates resilience patterns
- ✅ OpenAPI enables client generation + API contracts
- ✅ Partial failure handling improves service reliability

---

**Note:** This is a learning project demonstrating progressive architectural complexity. Each phase builds on previous work while introducing new patterns and best practices.
