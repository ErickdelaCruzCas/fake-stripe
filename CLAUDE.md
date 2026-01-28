# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 PROJECT STATUS

**Current Phase:** PHASE 4 - COMPLETE ✅
**Next Phase:** PHASE 5 - Advanced Patterns 🔜

**What We Built:**
- ✅ **Phase 1**: API aggregator with hexagonal architecture
- ✅ **Phase 2**: Multi-domain chaos service (4 bounded contexts)
- ✅ **Phase 3**: Basic Temporal workflows (User Context, Payment)
- ✅ **Phase 4**: Production Order Fulfillment with **10/10 Temporal features**

**Architecture Evolution:**
Progressive TypeScript project: API aggregator → Multi-domain microservices → Temporal orchestration → **Production-ready order fulfillment** (4 phases complete).

**Documentation:**
- `README.md` - Main documentation (updated for Phase 4)
- `QUICKSTART_PHASE4.md` - Quick start guide
- `docs/PHASE_4_PLAN.md` - Phase 4 implementation plan (historical reference)

---

## ✅ WHAT'S BUILT

### Phase 1: Founder Service (Port 3000)

Production-ready API aggregator with hexagonal architecture.

**Features:**
- Hexagonal architecture (Domain/Application/Infrastructure/Presentation)
- NestJS + Strategy Pattern (3 concurrency strategies: parallel, sequential, RxJS)
- HttpService with interceptors (logging, retry, correlation ID)
- Swagger/OpenAPI documentation

**Endpoints:**
- `GET /api/v1/user-context?strategy=promise-allsettled`
- `GET /health`
- `GET /api/docs`

---

### Phase 2: Fake Stripe Chaos (Port 3001)

Multi-domain chaos engineering service with hexagonal architecture per domain.

**Architecture:** Vertical Slices + Hexagonal inside each domain

**4 Bounded Contexts:**

1. **Payment Domain** (`/payment`)
   - `POST /payment/authorize` - Hold funds (40% success, 30% insufficient funds, 20% timeout, 10% error)
   - `POST /payment/capture` - Charge funds (70% success, 20% already captured, 10% timeout)
   - `POST /payment/release` - Release hold (90% success, 10% timeout)
   - `POST /payment/refund` - Refund charge (80% success, 10% already refunded, 10% timeout)
   - `GET /payment/chaos/distribution` - View chaos probabilities
   - `GET /payment/stats` - Legacy stats endpoint

2. **Inventory Domain** (`/inventory`)
   - `POST /inventory/reserve` - Reserve stock (50% success, 30% out of stock, 20% timeout)
   - `POST /inventory/release` - Release reservation (90% success, 10% timeout)

3. **Shipping Domain** (`/shipping`)
   - `POST /shipping/create-label` - Create label (60% success, 20% address error, 20% timeout, ~20s duration)
   - `POST /shipping/cancel` - Cancel label (90% success, 10% timeout)

4. **Notification Domain** (`/notification`)
   - `POST /notification/send` - Send email/SMS (80% success, 20% timeout)

**Key Features:**
- Hexagonal per domain: `domain/` → `application/` → `infrastructure/` → `presentation/`
- Shared infrastructure: `BaseChaosEngine`, correlation ID, base DTOs
- Domain-specific chaos scenarios with realistic probabilities
- Swagger documentation at http://localhost:3001/api/docs

**Structure:**
```
packages/fake-stripe-chaos/src/
├── shared/                    # Shared infrastructure
│   ├── chaos/                 # BaseChaosEngine
│   └── dto/                   # Base DTOs
├── payment/                   # Payment bounded context
│   ├── domain/                # PaymentAuthorization model
│   ├── application/           # Use cases
│   ├── infrastructure/        # PaymentChaosEngine, repo
│   └── presentation/          # PaymentController
├── inventory/                 # Inventory bounded context
├── shipping/                  # Shipping bounded context
└── notification/              # Notification bounded context
```

---

### Phase 3 & 4: Temporal Orchestration (Ports 3002, 7233, 8080)

Durable workflow orchestration with **3 production workflows** and **13 activities**.

**Components:**
- **Temporal Server** (7233) - Workflow orchestration engine
- **Temporal UI** (8080) - Workflow visibility and debugging
- **Temporal Worker** - Executes workflows and activities
- **Temporal API** (3002) - REST API for workflow management
- **PostgreSQL** (5432) - Temporal persistence

**Key Features:**
- Durable execution (survives crashes)
- Automatic retry with exponential backoff
- Complete Saga pattern with compensations
- Signals for human-in-the-loop and cancellation
- Queries for real-time progress tracking
- Activity heartbeats for long-running operations
- Full workflow history in Temporal UI

---

## 🔄 THE 3 WORKFLOWS

### 1. User Context Workflow (`userContextWorkflow`)

**Purpose:** Demonstrate parallel execution and partial failure handling.

**Flow:**
```
Parallel: [getCurrentLocationActivity, getWeatherActivity, getCatFactActivity]
     ↓
Return aggregated result (nulls for failures)
```

**Endpoints:**
- `POST /api/v1/workflows/user-context` - Start workflow
- `GET /api/v1/workflows/user-context-{userId}/status` - Get status
- `GET /api/v1/workflows/user-context-{userId}/progress` - Get progress
- `POST /api/v1/workflows/user-context-{userId}/cancel` - Cancel

**Features:**
- 2 execution strategies (parallel, sequential)
- Partial failure handling (returns null for failed services)
- Correlation ID propagation

---

### 2. Payment Workflow (`paymentWorkflow`)

**Purpose:** Demonstrate basic Saga pattern and compensating transactions.

**Flow:**
```
processPaymentActivity (charge payment)
     ↓ (on failure)
Compensation: refund payment
```

**Endpoints:**
- `POST /api/v1/workflows/payment` - Start workflow
- `GET /api/v1/workflows/payment-{orderId}/status` - Get status
- `POST /api/v1/workflows/payment-{orderId}/cancel` - Cancel & refund

**Features:**
- Saga pattern (refund on failure)
- Automatic retry (3 attempts)
- Cancellation support

---

### 3. Order Fulfillment Workflow (`orderFulfillmentWorkflow`) ⭐

**Purpose:** Production-ready workflow demonstrating ALL 10 Temporal features.

**Flow:**
```
1. authorizePayment (hold funds)
   ↓
2. Wait for Manager Approval (if requiresApproval=true)
   - Signal: approve/reject
   - Timeout: 2 minutes → auto-reject
   ↓ (approved)
3. reserveInventory (reserve stock)
   ↓
4. capturePayment (charge funds)
   ↓
5. createShippingLabel (long-running ~20s with heartbeat)
   ↓
6. sendNotification (non-critical)
   ✅ ORDER COMPLETE (status: "shipped")
```

**Endpoints:**

**Order Management:**
- `POST /api/v1/order` - Start order workflow

**Signals (modify running workflow):**
- `POST /api/v1/order/{workflowId}/approve` - Approve order (manager action)
- `POST /api/v1/order/{workflowId}/reject` - Reject order (triggers compensation)
- `POST /api/v1/order/{workflowId}/cancel` - Cancel order (full Saga rollback)

**Queries (read workflow state):**
- `GET /api/v1/order/{workflowId}/status` - Full order status with completed steps
- `GET /api/v1/order/{workflowId}/progress` - Progress percentage (0-100%)
- `GET /api/v1/order/{workflowId}/result` - Wait for completion (blocking)

**Saga Compensations (reverse order):**
```
On failure/cancellation:
1. cancelShippingLabel (if label was created)
2. refundPayment (if payment was captured)
3. releaseInventory (if stock was reserved)
4. releasePayment (if payment was authorized but not captured)
```

**10 Temporal Features Demonstrated:**
1. ✅ **Signals** - approve, reject, cancel order at any time
2. ✅ **Queries** - getOrderStatus, getProgress (real-time, read-only)
3. ✅ **Search Attributes** - TODO: needs Temporal config (orderId, customerId, orderStatus, totalAmount)
4. ✅ **Activity Heartbeats** - Shipping label progress tracking (0% → 100%)
5. ✅ **Activity Cancellation** - Graceful cleanup on workflow cancel
6. ✅ **Timeouts** - Approval timeout (2 min) auto-rejects
7. ✅ **Retry Policies** - Domain-specific (payment 3x, inventory 2x, shipping 5x)
8. ✅ **Saga Pattern** - Automatic compensation on failure
9. ✅ **Idempotency** - Safe activity retries with correlation IDs
10. ✅ **Long-Running Activities** - Shipping ~20s with progress updates

---

## 🎬 THE 13 ACTIVITIES

### User Context Activities (3)
1. **getCurrentLocationActivity** - Get location from IP
2. **getWeatherActivity** - Get weather for location
3. **getCatFactActivity** - Get random cat fact

### Payment Activities (5)
4. **processPaymentActivity** - Charge payment (legacy, Phase 3)
5. **authorizePayment** - Hold funds (retry: 3x, timeout: 30s)
6. **capturePayment** - Charge funds (retry: 3x, timeout: 30s)
7. **releasePayment** - Release hold (compensation, retry: 3x, timeout: 30s)
8. **refundPayment** - Refund charge (compensation, retry: 3x, timeout: 30s)

### Inventory Activities (2)
9. **reserveInventory** - Reserve stock (retry: 2x, timeout: 30s)
10. **releaseInventory** - Release stock (compensation, retry: 2x, timeout: 30s)

### Shipping Activities (2)
11. **createShippingLabel** - Create label with heartbeats (retry: 5x, timeout: 60s, duration: ~20s)
12. **cancelShippingLabel** - Cancel label (compensation, retry: 2x, timeout: 30s)

### Notification Activities (1)
13. **sendNotification** - Email customer (non-retryable, timeout: 10s)

**All activities:**
- Accept correlation ID for distributed tracing
- Call corresponding Fake Stripe domain endpoints
- Handle chaos scenarios (retries, timeouts, errors)
- Return structured results with IDs for compensation

---

## ⚡ QUICK START

```bash
# Start all services
docker-compose up -d

# Test Order Fulfillment (interactive script)
./test-order.sh

# Or manual test
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-001","customerId":"CUST-001","items":[{"sku":"ITEM-001","quantity":2,"price":29.99}],"totalAmount":59.98,"shippingAddress":{"street":"123 Main St","city":"San Francisco","state":"CA","zip":"94105","country":"US"},"customerEmail":"test@example.com","requiresApproval":false}'

# Check status
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-001/status | jq

# Monitor in Temporal UI
open http://localhost:8080
```

**Service URLs:**
- **Temporal API**: http://localhost:3002/api/docs
- **Temporal UI**: http://localhost:8080
- **Fake Stripe**: http://localhost:3001/api/docs
- Founder API: http://localhost:3000/api/docs (optional)

**Test Files:**
- `packages/temporal-api/requests-order.http` - Order Fulfillment (7 scenarios) ⭐
- `packages/temporal-api/requests.http` - User Context & Payment workflows
- `packages/fake-stripe-chaos/requests.http` - Domain endpoint tests
- `test-order.sh` - Interactive testing script ⭐

---

## 💡 WORKING GUIDELINES

### Code Quality
- Approach as a senior software engineer
- Production-grade systems: proper error handling, logging, maintainability
- Prioritize clean code, proper patterns, educational value
- Always answer concisely

### Architecture Principles
- **SOLID Principles** - especially SRP and DIP
- **Hexagonal Architecture** - Domain isolated from infrastructure
- **Vertical Slice Architecture** - Bounded contexts as first-class citizens
- **Dependency Injection** - everything testable
- **Composition over inheritance**

### Functional Programming
- **Favor pure functions** - no side effects whenever possible
- **Prefer immutability** - use `const`, `readonly`, immutable structures
- **Deterministic functions** - same input = same output
- **Isolate side effects** - I/O, DB, mutations only in infrastructure/adapters

### Best Practices
- **HttpService > axios** - use `@nestjs/axios` for interceptors, retry, logging
- **Correlation ID** - propagate through all services for distributed tracing
- **Strategy Pattern** - swap implementations at runtime
- **Partial failures** - return null fields instead of failing completely
- **Structured logging** - JSON format with context

---

## 🏗️ ARCHITECTURE PATTERNS

### Hexagonal Architecture (Phase 1)

```
Domain (pure business logic)
  ↓ uses
Ports (interfaces)
  ↓ implemented by
Adapters (external integrations)
  ↓
Presentation (controllers)
```

**Structure:**
```
src/
├── domain/              # Pure business logic (no framework deps)
│   ├── models/          # Entities
│   ├── ports/           # Interfaces
│   └── services/        # Business logic
├── application/         # Use cases & DTOs
│   └── dto/             # Data transfer objects
├── infrastructure/      # External dependencies
│   ├── adapters/        # API integrations
│   ├── strategies/      # Concurrency strategies
│   └── interceptors/    # HTTP interceptors
└── presentation/        # API layer
    └── controllers/     # REST controllers
```

### Vertical Slice + Hexagonal (Phase 2)

Each domain is a vertical slice with hexagonal architecture inside:

```
packages/fake-stripe-chaos/src/
├── shared/                    # Shared infrastructure
│   ├── chaos/                 # BaseChaosEngine
│   └── dto/                   # Base DTOs
│
├── payment/                   # Payment bounded context
│   ├── domain/                # PaymentAuthorization model
│   ├── application/           # Use cases (authorize, capture, release, refund)
│   ├── infrastructure/        # PaymentChaosEngine, in-memory repo
│   └── presentation/          # PaymentController
│
├── inventory/                 # Inventory bounded context (same structure)
├── shipping/                  # Shipping bounded context
└── notification/              # Notification bounded context
```

**Key Principles:**
- Each domain is independent (can be extracted to its own service)
- Hexagonal architecture inside each domain
- Shared infrastructure for cross-cutting concerns
- Domain-specific chaos scenarios

### Temporal Workflow Architecture (Phase 3 & 4)

```
Client → Temporal API (REST)
              ↓
         Temporal Server (orchestrator)
              ↓
         Temporal Worker (executes workflows)
              ↓
         Activities (business logic)
              ↓
         External Services (Fake Stripe domains, External APIs)
```

**Execution Flow:**
1. Client calls REST API
2. Temporal API starts workflow via Temporal Client
3. Temporal Server persists workflow state
4. Worker picks up workflow task
5. Workflow executes activities (retries, timeouts, heartbeats)
6. Worker persists each step in event history
7. Client queries workflow state via Queries
8. Client modifies workflow via Signals

---

## 🔧 COMMON PATTERNS FOR EXTENSION

### Adding a New Domain to Fake Stripe

1. **Create domain structure:**
```bash
mkdir -p packages/fake-stripe-chaos/src/my-domain/{domain,application,infrastructure,presentation}
```

2. **Create domain model** (`domain/models/my-entity.model.ts`):
```typescript
export class MyEntity {
  constructor(
    public readonly id: string,
    public readonly status: string,
    // ... other fields
  ) {}

  // Business logic methods
  canBeProcessed(): boolean {
    return this.status === 'pending';
  }
}
```

3. **Create use case** (`application/use-cases/process-entity.use-case.ts`):
```typescript
@Injectable()
export class ProcessEntityUseCase {
  constructor(
    private readonly repository: MyEntityRepositoryPort,
    private readonly chaosEngine: MyDomainChaosEngine,
  ) {}

  async execute(input: ProcessEntityInput): Promise<ProcessEntityOutput> {
    return this.chaosEngine.executeWithChaos(async () => {
      // Business logic here
      const entity = new MyEntity(/* ... */);
      await this.repository.save(entity);
      return { entityId: entity.id };
    }, input.correlationId);
  }
}
```

4. **Create chaos engine** (`infrastructure/chaos/my-domain-chaos.engine.ts`):
```typescript
@Injectable()
export class MyDomainChaosEngine extends BaseChaosEngine {
  protected getScenarios(operation: string): ChaosScenario[] {
    if (operation === 'process') {
      return [
        { type: 'success', probability: 70, statusCode: 200 },
        { type: 'timeout', probability: 20, delay: 5000 },
        { type: 'error', probability: 10, statusCode: 500, message: 'Processing failed' },
      ];
    }
    return this.getDefaultScenarios();
  }
}
```

5. **Create controller** (`presentation/controllers/my-domain.controller.ts`):
```typescript
@ApiTags('my-domain')
@Controller('my-domain')
export class MyDomainController {
  constructor(private readonly processEntityUseCase: ProcessEntityUseCase) {}

  @Post('process')
  async process(@Body() dto: ProcessEntityDto): Promise<ProcessEntityResponseDto> {
    const result = await this.processEntityUseCase.execute(dto);
    return { success: true, entityId: result.entityId };
  }
}
```

6. **Create module and register:**
```typescript
@Module({
  controllers: [MyDomainController],
  providers: [ProcessEntityUseCase, MyDomainChaosEngine, /* ... */],
})
export class MyDomainModule {}
```

7. **Import in app.module.ts:**
```typescript
@Module({
  imports: [PaymentModule, InventoryModule, ShippingModule, NotificationModule, MyDomainModule],
})
export class AppModule {}
```

### Adding a New Temporal Activity

1. **Create activity file** (`packages/temporal-worker/src/activities/my-domain.activities.ts`):
```typescript
import * as activity from '@temporalio/activity';

export async function myDomainActivity(input: MyDomainInput): Promise<MyDomainResult> {
  const correlationId = input.correlationId || activity.Context.current().info.workflowExecution.workflowId;

  try {
    const response = await axios.post('http://fake-stripe-chaos:3001/my-domain/process', {
      ...input,
    }, {
      headers: { 'X-Correlation-Id': correlationId },
    });

    return {
      entityId: response.data.entityId,
      correlationId,
    };
  } catch (error) {
    console.error('My domain activity failed:', error);
    throw new Error(`My domain processing failed: ${error.message}`);
  }
}

// Compensation activity
export async function compensateMyDomainActivity(input: { entityId: string }): Promise<void> {
  await axios.post('http://fake-stripe-chaos:3001/my-domain/cancel', {
    entityId: input.entityId,
  });
}
```

2. **Export from index** (`packages/temporal-worker/src/activities/index.ts`):
```typescript
export * from './my-domain.activities';
```

3. **Register in worker** (`packages/temporal-worker/src/worker.ts`):
```typescript
import * as myDomainActivities from './activities/my-domain.activities';

const worker = await Worker.create({
  // ...
  activities: {
    ...userContextActivities,
    ...paymentActivities,
    ...inventoryActivities,
    ...shippingActivities,
    ...notificationActivities,
    ...myDomainActivities, // Add new activities
  },
});
```

4. **Use in workflow:**
```typescript
import { myDomainActivity, compensateMyDomainActivity } from '../activities';

export async function myWorkflow(input: MyWorkflowInput): Promise<MyWorkflowOutput> {
  let entityId: string | null = null;

  try {
    // Execute activity
    const result = await proxyActivities<typeof myDomainActivities>({
      startToCloseTimeout: '30s',
      retry: {
        maximumAttempts: 3,
        initialInterval: '1s',
        backoffCoefficient: 2,
      },
    }).myDomainActivity(input);

    entityId = result.entityId;

    // ... continue workflow

  } catch (error) {
    // Compensation
    if (entityId) {
      await proxyActivities<typeof myDomainActivities>({
        startToCloseTimeout: '30s',
      }).compensateMyDomainActivity({ entityId });
    }
    throw error;
  }
}
```

### Adding a New Workflow

1. **Create workflow file** (`packages/temporal-worker/src/workflows/my.workflow.ts`):
```typescript
import { proxyActivities, defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities';

// Define signals
export const mySignal = defineSignal('mySignal');

// Define queries
export const getMyStatus = defineQuery<MyStatus>('getMyStatus');

export async function myWorkflow(input: MyWorkflowInput): Promise<MyWorkflowOutput> {
  let status: MyStatus = { /* ... */ };

  // Set signal handlers
  setHandler(mySignal, () => {
    // Handle signal
    status.signalReceived = true;
  });

  // Set query handlers
  setHandler(getMyStatus, () => status);

  // Execute workflow logic
  const activities = proxyActivities<typeof activities>({
    startToCloseTimeout: '30s',
    retry: { maximumAttempts: 3 },
  });

  // ... workflow steps

  return { success: true, /* ... */ };
}
```

2. **Export from index** (`packages/temporal-worker/src/workflows/index.ts`):
```typescript
export * from './my.workflow';
```

3. **Add REST endpoint** (`packages/temporal-api/src/workflows/workflow.controller.ts`):
```typescript
@Post('my-workflow')
async startMyWorkflow(@Body() dto: MyWorkflowDto) {
  const handle = await this.client.workflow.start('myWorkflow', {
    taskQueue: 'founder-tasks',
    workflowId: `my-workflow-${dto.id}`,
    args: [dto],
  });

  return {
    success: true,
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
  };
}
```

---

## 📚 TECH STACK

- **TypeScript** (strict mode) - Type-safe development
- **NestJS** - Microservices framework
- **Temporal** - Workflow orchestration
- **@nestjs/axios + RxJS** - HTTP client + reactive programming
- **Swagger/OpenAPI** - API documentation
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Temporal persistence

---

## 🔍 KEY LEARNINGS

### Phase 1 (Hexagonal Architecture)
- ✅ Hexagonal Architecture separates business logic from infrastructure
- ✅ Strategy Pattern enables runtime behavior swapping
- ✅ HttpService interceptors centralize cross-cutting concerns
- ✅ Correlation IDs enable distributed tracing

### Phase 2 (Vertical Slices)
- ✅ Vertical Slices organize by business capability, not technical layer
- ✅ Each domain can have its own architecture (hexagonal inside)
- ✅ Shared infrastructure for cross-cutting concerns (chaos engine, DTOs)
- ✅ Chaos Engineering validates resilience patterns

### Phase 3 & 4 (Temporal)
- ✅ Durable execution survives crashes and restarts
- ✅ Automatic retry eliminates manual retry logic
- ✅ Saga pattern provides automatic compensations
- ✅ Signals enable human-in-the-loop workflows
- ✅ Queries provide real-time workflow state
- ✅ Activity heartbeats track long-running operations
- ✅ Temporal UI provides full observability

---

## 🚀 NEXT STEPS (Phase 5)

### Advanced Temporal Patterns
- **Continue-as-new** - Handle infinite workflows (subscriptions, recurring tasks)
- **Workflow Versioning** - Deploy new versions without breaking running workflows
- **Schedules** - Cron-like recurring workflows
- **Child Workflows** - Workflow composition and orchestration
- **Search Attributes** - Custom workflow indexing (needs Temporal config setup)

### Production Observability
- Structured logging with Pino
- Prometheus metrics + Grafana dashboards
- Distributed tracing with OpenTelemetry
- E2E tests (Jest + Supertest)
- Integration tests for workflows

### Cloud Deployment
- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Production configuration management
- Auto-scaling policies
- Monitoring & alerting

---

**Note:** This is a learning project demonstrating progressive architectural complexity. Each phase builds on previous work while introducing new patterns and best practices. The codebase is production-ready and can serve as a foundation for real-world order fulfillment systems.
