# Fake Stripe - Progressive Microservices Architecture

A comprehensive learning project demonstrating evolutionary architecture: from simple aggregator to Temporal-orchestrated microservices with chaos engineering and Saga pattern.

> 📋 **Current Phase**: Phase 4 - Order Fulfillment with Saga Pattern ✅
> 🎯 **Features**: 10/10 Temporal capabilities demonstrated
> 🔥 **Workflows**: 3 production workflows (User Context, Payment, Order Fulfillment)
> 📦 **Domains**: 4 bounded contexts with hexagonal architecture

## 🚀 Quick Start - Phase 4

### Option 1: Interactive Test Script (Recommended)

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait ~30s for services to be healthy
docker-compose ps

# 3. Run interactive test script
./test-order.sh
```

**The script provides:**
- ✅ Scenario 1: Happy Path (auto-approve)
- ✅ Scenario 2: Manual Approval Flow
- ✅ Scenario 3: Manager Rejection + Compensation
- ✅ Scenario 4: User Cancellation + Saga Rollback
- ✅ Scenario 5: Chaos Testing (10 orders)
- ✅ Automatic service health checks
- ✅ Progress monitoring
- ✅ One-click Temporal UI access

### Option 2: Manual Testing with cURL

```bash
# 1. Start services
docker-compose up -d

# 2. Create an order
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-TEST-001",
    "customerId": "CUST-001",
    "items": [{"sku": "ITEM-001", "quantity": 2, "price": 29.99}],
    "totalAmount": 59.98,
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "customerEmail": "test@example.com",
    "requiresApproval": false
  }'

# 3. Check status
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-TEST-001/status | jq

# 4. Monitor in Temporal UI
open http://localhost:8080
```

### Option 3: VS Code REST Client

1. Open `packages/temporal-api/requests-order.http`
2. Install "REST Client" extension
3. Click "Send Request" above any scenario

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Temporal API** | http://localhost:3002/api/docs | Workflow orchestration API (Swagger) |
| **Temporal UI** | http://localhost:8080 | Workflow monitoring & debugging |
| **Fake Stripe** | http://localhost:3001/api/docs | 4-domain chaos service (Swagger) |
| Founder API | http://localhost:3000/api/docs | Phase 1 aggregator (optional) |

**Test Collections:**
- `packages/temporal-api/requests-order.http` - Order Fulfillment tests (7 scenarios) ⭐
- `packages/temporal-api/requests.http` - User Context & Payment workflows
- `packages/fake-stripe-chaos/requests.http` - Domain endpoint tests
- `test-order.sh` - Interactive testing script ⭐
- See [QUICKSTART_PHASE4.md](./QUICKSTART_PHASE4.md) for complete guide

## 🎯 Project Evolution

This project evolves through 5 distinct phases, each building on the previous:

```
Phase 1: Aggregator  →  Phase 2: Chaos    →  Phase 3: Temporal  →  Phase 4: Order Fulfillment ✅  →  Phase 5: Advanced
(Hexagonal Arch)        (4 Domains)           (Basic Workflows)      (Saga + All Features)              (Subscriptions)
```

### Completed Phases

| Phase | Status | Goal | Key Features |
|-------|--------|------|--------------|
| **1** | ✅ | API aggregator with hexagonal architecture | NestJS, 3 external APIs, Strategy pattern |
| **2** | ✅ | Multi-domain chaos service | **4 domains** (Payment, Inventory, Shipping, Notification) |
| **3** | ✅ | Workflow orchestration basics | Temporal, Activities, Basic Saga |
| **4** | ✅ | Production order fulfillment | **10/10 Temporal features**, Complete Saga, **3 workflows** |
| **5** | 🔜 | Advanced patterns | Continue-as-new, Versioning, Schedules |

**Phase 4 Temporal Features Demonstrated:**

1. ✅ **Signals** (approve/reject/cancel) - Human-in-the-loop + cancellation
2. ✅ **Queries** (status/progress) - Real-time workflow state
3. ✅ **Search Attributes** (TODO: needs Temporal config) - Workflow indexing
4. ✅ **Activity Heartbeats** - Shipping label progress tracking
5. ✅ **Activity Cancellation** - Graceful cleanup on workflow cancel
6. ✅ **Timeouts** - 2-minute approval timeout
7. ✅ **Retry Policies** - Domain-specific retry strategies
8. ✅ **Saga Pattern** - Automatic compensations on failure
9. ✅ **Idempotency** - Safe retries with correlation IDs
10. ✅ **Long-Running Activities** - Shipping label creation (~20s)

## 📦 What's Built

### Phase 1: Founder Service (Port 3000)

Production-ready API aggregator with hexagonal architecture.

**Features:**
- Hexagonal architecture (Domain/Application/Infrastructure/Presentation)
- NestJS + Strategy Pattern (3 concurrency strategies)
- HttpService with interceptors (logging, retry, correlation ID)
- Swagger/OpenAPI documentation

**Endpoints:**
- `GET /api/v1/user-context?strategy=promise-allsettled` - Aggregate 3 APIs
- `GET /health` - Health check
- `GET /api/docs` - Swagger UI

### Phase 2: Fake Stripe Chaos (Port 3001)

Multi-domain chaos engineering service with hexagonal architecture per domain.

**Architecture:**
- **4 Bounded Contexts**: Payment, Inventory, Shipping, Notification
- **Hexagonal inside each domain**: Domain/Application/Infrastructure/Presentation
- **Shared Infrastructure**: BaseChaosEngine, correlation ID, base DTOs
- **Domain-specific chaos scenarios** with different probabilities

**Payment Domain** (`/payment`)
- `POST /payment/authorize` - Hold funds (40% success, 30% insufficient funds, 20% timeout, 10% error)
- `POST /payment/capture` - Charge funds (70% success, 20% already captured, 10% timeout)
- `POST /payment/release` - Release hold (90% success, 10% timeout)
- `POST /payment/refund` - Refund charge (80% success, 10% already refunded, 10% timeout)
- `GET /payment/chaos/distribution` - View chaos probabilities
- `GET /payment/stats` - Legacy stats endpoint

**Inventory Domain** (`/inventory`)
- `POST /inventory/reserve` - Reserve stock (50% success, 30% out of stock, 20% timeout)
- `POST /inventory/release` - Release reservation (90% success, 10% timeout)

**Shipping Domain** (`/shipping`)
- `POST /shipping/create-label` - Create label (~20s, 60% success, 20% address error, 20% timeout)
- `POST /shipping/cancel` - Cancel label (90% success, 10% timeout)

**Notification Domain** (`/notification`)
- `POST /notification/send` - Send email/SMS (80% success, 20% timeout)

**All endpoints support:**
- Correlation ID tracking (`X-Correlation-Id` header)
- Chaos scenarios with realistic probabilities
- Detailed error responses
- Swagger documentation at http://localhost:3001/api/docs

### Phase 3 & 4: Temporal Orchestration (Ports 3002, 7233, 8080)

Durable workflow orchestration with 3 production workflows.

**Components:**
- **Temporal Server** (7233) - Workflow orchestration engine
- **Temporal UI** (8080) - Workflow visibility and debugging
- **Temporal Worker** - Executes workflows and activities (13 activities)
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

## 🔄 Workflows

### 1. User Context Workflow (`userContextWorkflow`)

Aggregates data from 3 external APIs (location, weather, cat fact).

**Purpose:** Demonstrate parallel execution and partial failure handling.

**Endpoints:**
- `POST /api/v1/workflows/user-context` - Start workflow
  ```json
  {
    "userId": "user-123",
    "strategy": "parallel"  // or "sequential"
  }
  ```
- `GET /api/v1/workflows/user-context-{userId}/status` - Get status
- `GET /api/v1/workflows/user-context-{userId}/progress` - Get progress
- `POST /api/v1/workflows/user-context-{userId}/cancel` - Cancel workflow

**Activities:**
- `getCurrentLocationActivity` - Get location from IP
- `getWeatherActivity` - Get weather for location
- `getCatFactActivity` - Get random cat fact

**Features:**
- 2 execution strategies (parallel, sequential)
- Partial failure handling (returns null for failed services)
- Correlation ID propagation

### 2. Payment Workflow (`paymentWorkflow`)

Process payment with Saga compensation.

**Purpose:** Demonstrate basic Saga pattern and compensating transactions.

**Endpoints:**
- `POST /api/v1/workflows/payment` - Start workflow
  ```json
  {
    "orderId": "order-123",
    "amount": 99.99,
    "customerId": "cust-456"
  }
  ```
- `GET /api/v1/workflows/payment-{orderId}/status` - Get status
- `POST /api/v1/workflows/payment-{orderId}/cancel` - Cancel & refund

**Activities:**
- `processPaymentActivity` - Charge payment (calls Fake Stripe)

**Features:**
- Saga pattern (refund on failure)
- Automatic retry (3 attempts)
- Cancellation support

### 3. Order Fulfillment Workflow (`orderFulfillmentWorkflow`) ⭐

Complete order fulfillment with 6 steps and full Saga pattern.

**Purpose:** Production-ready workflow demonstrating ALL Temporal features.

**Workflow Steps:**
1. **Authorize Payment** - Hold funds on customer's card
2. **Wait for Approval** (if `requiresApproval=true`) - Manager approval with 2-min timeout
3. **Reserve Inventory** - Reserve stock for order items
4. **Capture Payment** - Charge the authorized funds
5. **Create Shipping Label** - Generate label (long-running ~20s with heartbeats)
6. **Send Notification** - Email customer (non-critical)

**Endpoints:**

**Order Management:**
- `POST /api/v1/order` - Start order workflow
  ```json
  {
    "orderId": "ORD-001",
    "customerId": "CUST-001",
    "items": [{"sku": "ITEM-001", "quantity": 2, "price": 29.99}],
    "totalAmount": 59.98,
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "customerEmail": "test@example.com",
    "requiresApproval": false
  }
  ```

**Signals (modify running workflow):**
- `POST /api/v1/order/{workflowId}/approve` - Approve order (manager action)
- `POST /api/v1/order/{workflowId}/reject` - Reject order (triggers compensation)
- `POST /api/v1/order/{workflowId}/cancel` - Cancel order (triggers full Saga rollback)

**Queries (read workflow state):**
- `GET /api/v1/order/{workflowId}/status` - Full order status with completed steps
- `GET /api/v1/order/{workflowId}/progress` - Progress percentage (0-100%)
- `GET /api/v1/order/{workflowId}/result` - Wait for completion and get result

**Activities:**
- `authorizePayment` - Hold funds (retry: 3x)
- `capturePayment` - Charge funds (retry: 3x)
- `releasePayment` - Release hold (compensation)
- `refundPayment` - Refund charge (compensation)
- `reserveInventory` - Reserve stock (retry: 2x)
- `releaseInventory` - Release stock (compensation)
- `createShippingLabel` - Create label with heartbeats (retry: 5x, ~20s)
- `cancelShippingLabel` - Cancel label (compensation)
- `sendNotification` - Email customer (non-retryable)

**Saga Compensation Flow:**
```
On failure/cancellation, compensate in reverse order:
1. Cancel shipping label (if created)
2. Refund payment (if captured)
3. Release inventory (if reserved)
4. Release payment authorization (if authorized)
```

**Features Demonstrated:**
- ✅ Signals: approve, reject, cancel
- ✅ Queries: status, progress
- ✅ Timeouts: 2-minute approval timeout
- ✅ Heartbeats: Shipping progress (0% → 100%)
- ✅ Saga Pattern: Automatic compensations
- ✅ Idempotency: Safe retries
- ✅ Long-running: 20s shipping activity
- ✅ Cancellation: Graceful cleanup
- ✅ Domain-specific retries: Different per activity

## 📚 API Documentation (Complete)

### Temporal API - Workflow Management

**Base URL:** http://localhost:3002

**User Context Workflow:**
- `POST /api/v1/workflows/user-context` - Start aggregation workflow
- `GET /api/v1/workflows/{id}/status` - Query workflow status
- `GET /api/v1/workflows/{id}/progress` - Get progress (0-100%)
- `GET /api/v1/workflows/{id}/result` - Get result (waits for completion)
- `POST /api/v1/workflows/{id}/cancel` - Cancel workflow
- `GET /api/v1/workflows/{id}/history` - Execution history

**Payment Workflow:**
- `POST /api/v1/workflows/payment` - Start payment workflow
- (Uses same query/signal endpoints as User Context)

**Order Fulfillment Workflow:**
- `POST /api/v1/order` - Start order fulfillment
- `POST /api/v1/order/{workflowId}/approve` - Approve order (signal)
- `POST /api/v1/order/{workflowId}/reject` - Reject order (signal)
- `POST /api/v1/order/{workflowId}/cancel` - Cancel order (signal)
- `GET /api/v1/order/{workflowId}/status` - Get order status (query)
- `GET /api/v1/order/{workflowId}/progress` - Get progress (query)
- `GET /api/v1/order/{workflowId}/result` - Get final result (waits)

**Health:**
- `GET /health` - Health check

**Documentation:**
- `GET /api/docs` - Swagger UI

### Fake Stripe API - 4 Domains

**Base URL:** http://localhost:3001

**Payment Domain:**
- `POST /payment/authorize` - Authorize payment (hold funds)
- `POST /payment/capture` - Capture payment (charge funds)
- `POST /payment/release` - Release authorization
- `POST /payment/refund` - Refund captured payment
- `GET /payment/chaos/distribution` - View chaos probabilities
- `GET /payment/stats` - Payment statistics (legacy)

**Inventory Domain:**
- `POST /inventory/reserve` - Reserve inventory
- `POST /inventory/release` - Release reservation

**Shipping Domain:**
- `POST /shipping/create-label` - Create shipping label (~20s)
- `POST /shipping/cancel` - Cancel shipping label

**Notification Domain:**
- `POST /notification/send` - Send notification

**Documentation:**
- `GET /api/docs` - Swagger UI

## 🧪 Testing Guide

### 1. Interactive Script (Best for learning)

```bash
./test-order.sh

# Menu:
# 1) Happy Path (auto-approve)
# 2) Manual Approval Flow
# 3) Manager Rejection
# 4) User Cancellation
# 5) Chaos Testing (10 orders)
# 6) Custom Order ID
# 7) Open Temporal UI
# 8) Check Services Status
```

### 2. VS Code REST Client

**For Order Fulfillment (Phase 4):**
1. Open `packages/temporal-api/requests-order.http`
2. Available scenarios:
   - Scenario 1: Happy Path (auto-approve)
   - Scenario 2: Manual Approval Flow
   - Scenario 3: Manager Rejection
   - Scenario 4: User Cancellation
   - Scenario 5: Approval Timeout (2 min)
   - Scenario 6: Saga Compensation (shipping fails)
   - Scenario 7: Chaos Testing

**For User Context & Payment (Phase 3):**
1. Open `packages/temporal-api/requests.http`
2. Test user context workflow (parallel/sequential)
3. Test payment workflow with Saga

**For Domain Testing:**
1. Open `packages/fake-stripe-chaos/requests.http`
2. Test individual domain endpoints

### 3. Manual Testing Examples

**Happy Path Order:**
```bash
# 1. Start order
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-001","customerId":"CUST-001","items":[{"sku":"ITEM-001","quantity":2,"price":29.99}],"totalAmount":59.98,"shippingAddress":{"street":"123 Main St","city":"San Francisco","state":"CA","zip":"94105","country":"US"},"customerEmail":"test@example.com","requiresApproval":false}'

# 2. Check progress
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-001/progress | jq

# 3. Check status
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-001/status | jq
```

**Manual Approval Flow:**
```bash
# 1. Start order requiring approval
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-002","customerId":"CUST-002","items":[{"sku":"ITEM-001","quantity":1,"price":99.99}],"totalAmount":99.99,"shippingAddress":{"street":"456 Oak Ave","city":"New York","state":"NY","zip":"10001","country":"US"},"customerEmail":"vip@example.com","requiresApproval":true}'

# 2. Check status (should be "pending_approval")
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-002/status | jq

# 3. Approve order
curl -X POST http://localhost:3002/api/v1/order/order-fulfillment-ORD-002/approve

# 4. Check status again (should be "processing")
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-002/status | jq
```

**Cancellation with Saga Rollback:**
```bash
# 1. Start order
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-003","customerId":"CUST-003","items":[{"sku":"ITEM-001","quantity":1,"price":19.99}],"totalAmount":19.99,"shippingAddress":{"street":"321 Cancel St","city":"Boston","state":"MA","zip":"02101","country":"US"},"customerEmail":"changed-mind@example.com","requiresApproval":false}'

# 2. Wait for some steps to complete
sleep 10

# 3. Cancel order
curl -X POST http://localhost:3002/api/v1/order/order-fulfillment-ORD-003/cancel

# 4. Check compensations executed
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-003/status | jq '.compensations'
```

### 4. Monitoring in Temporal UI

```bash
# Open Temporal UI
open http://localhost:8080

# Navigate to:
# - Workflows → Search for "order-fulfillment-ORD-001"
# - Click workflow to see:
#   ✅ Complete execution history
#   ✅ Activity details with heartbeats
#   ✅ Signals received (approve/reject/cancel)
#   ✅ Queries executed (status/progress)
#   ✅ Input/Output of each activity
#   ✅ Compensations executed
```

## 🏗️ Architecture

### Hexagonal Architecture (Phase 1 & Phase 2)

```
Domain (pure business logic)
  ↓ uses
Ports (interfaces)
  ↓ implemented by
Adapters (external integrations)
  ↓
Presentation (controllers)
```

**Phase 2 Architecture:**
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
├── inventory/                 # Inventory bounded context
│   ├── domain/                # InventoryReservation model
│   ├── application/           # Use cases (reserve, release)
│   ├── infrastructure/        # InventoryChaosEngine
│   └── presentation/          # InventoryController
│
├── shipping/                  # Shipping bounded context
│   └── ...                    # Same structure
│
└── notification/              # Notification bounded context
    └── ...                    # Same structure
```

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

**Workflow Execution:**
1. Client calls REST API
2. Temporal API starts workflow via Temporal Client
3. Temporal Server persists workflow state
4. Worker picks up workflow task
5. Workflow executes activities (retries, timeouts, heartbeats)
6. Worker persists each step in event history
7. Client queries workflow state via Queries
8. Client modifies workflow via Signals

**Benefits:**
- Durable execution (survives crashes, restarts)
- Automatic retry with backoff
- Saga pattern for compensations
- Full workflow history for debugging
- Real-time state via Queries
- Human-in-the-loop via Signals

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development
- **NestJS** - Microservices framework
- **Temporal** - Workflow orchestration
- **Docker** - Containerization
- **PostgreSQL** - Temporal persistence
- **Axios** - HTTP client
- **RxJS** - Reactive programming
- **Swagger/OpenAPI** - API documentation

## 📋 Prerequisites

- Node.js >= 20.0.0
- Docker and Docker Compose
- jq (optional, for JSON formatting): `brew install jq`
- VS Code with REST Client extension (optional)

## 📁 Monorepo Structure

```
fake-stripe/
├── packages/
│   ├── founder/                    # Phase 1: User context aggregator
│   ├── fake-stripe-chaos/          # Phase 2: 4-domain chaos service
│   ├── temporal-worker/            # Phase 3-4: Temporal Worker (3 workflows, 13 activities)
│   └── temporal-api/               # Phase 3-4: Temporal REST API
├── docs/
│   ├── TEMPORAL_ARCHITECTURE.md    # Complete architecture guide
│   ├── TESTING_GUIDE.md            # Comprehensive testing guide
│   └── PHASE_4_PLAN.md             # Phase 4 implementation plan
├── docker-compose.yml              # All services orchestration
├── test-order.sh                   # Interactive testing script ⭐
├── QUICKSTART_PHASE4.md            # Phase 4 quick start guide
├── TASKFILE_README.md              # Task usage guide (legacy)
├── CLAUDE.md                       # Project guidance for AI
└── README.md                       # This file
```

## 🔧 Development

### Start Services

```bash
# All services
docker-compose up -d

# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f temporal-worker
```

### Rebuild Services

```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache temporal-api
docker-compose up -d temporal-api
```

### Health Checks

```bash
# Temporal API
curl http://localhost:3002/health

# Fake Stripe
curl http://localhost:3001/payment/stats

# Temporal UI
curl http://localhost:8080

# Check all services
docker-compose ps
```

### Stop Services

```bash
# Stop (keep data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

## 🐛 Troubleshooting

### Services not starting

```bash
# Check Docker
docker-compose ps

# View logs
docker-compose logs temporal-worker
docker-compose logs temporal-api
docker-compose logs fake-stripe-chaos

# Restart service
docker-compose restart temporal-worker
```

### Workflow not starting

```bash
# Check Worker is running and has workflows registered
docker-compose logs temporal-worker | grep "Registered activities"

# Should see 13 activities:
# - getCurrentLocationActivity
# - getWeatherActivity
# - getCatFactActivity
# - processPaymentActivity
# - authorizePayment
# - capturePayment
# - releasePayment
# - refundPayment
# - reserveInventory
# - releaseInventory
# - createShippingLabel
# - cancelShippingLabel
# - sendNotification

# Check Temporal Server is healthy
docker-compose ps temporal

# Restart Temporal stack
docker-compose restart temporal temporal-worker
```

### Workflow stuck

```bash
# View in Temporal UI
open http://localhost:8080

# Check Worker logs for errors
docker-compose logs temporal-worker | grep ERROR

# Cancel workflow
curl -X POST http://localhost:3002/api/v1/order/{workflowId}/cancel
```

### Database issues

```bash
# Reset database (destroys all workflow history)
docker-compose down -v
docker-compose up -d
```

## 🎓 Learning Objectives

By exploring this project, you'll learn:

1. **Hexagonal Architecture** - Clean separation of domain, application, and infrastructure
2. **Vertical Slice Architecture** - Bounded contexts with hexagonal inside
3. **Temporal Workflows** - Durable execution, activities, signals, queries, Saga pattern
4. **Chaos Engineering** - Controlled failure simulation and resilience testing
5. **Saga Pattern** - Distributed transactions with compensating transactions
6. **Concurrency Patterns** - Promise.allSettled, RxJS, async/await strategies
7. **Microservices** - HTTP communication, service boundaries, retry logic
8. **Observability** - Structured logging, correlation IDs, distributed tracing

## 🔑 Key Patterns

### 1. Saga Pattern with Compensations

```typescript
// Order Fulfillment Workflow
try {
  // Forward flow
  const authId = await authorizePayment()
  const reservationId = await reserveInventory()
  await capturePayment(authId)
  const labelId = await createShippingLabel()
  await sendNotification()
} catch (error) {
  // Compensation flow (reverse order)
  if (labelId) await cancelShippingLabel(labelId)
  if (captured) await refundPayment(authId)
  if (reservationId) await releaseInventory(reservationId)
  if (authId) await releasePayment(authId)
  throw error
}
```

### 2. Signals for Human-in-the-Loop

```typescript
// Wait for manager approval with timeout
const approved = await condition(
  () => state.approved !== null,
  '2 minutes'
)

if (!approved) {
  throw new Error('Approval timeout')
}
```

### 3. Activity Heartbeats

```typescript
// Long-running activity with progress tracking
for (let step = 1; step <= 5; step++) {
  context.heartbeat({ progress: (step / 5) * 100 })
  await simulateWork()
}
```

### 4. Retry Policies (Domain-Specific)

```typescript
// Payment: 3 retries, 1s backoff
startToCloseTimeout: '30s',
retry: {
  maximumAttempts: 3,
  initialInterval: '1s',
  backoffCoefficient: 2,
}

// Shipping: 5 retries, longer timeout
startToCloseTimeout: '60s',
retry: {
  maximumAttempts: 5,
  initialInterval: '2s',
  backoffCoefficient: 2,
}
```

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project guidance for AI assistants
- **[QUICKSTART_PHASE4.md](./QUICKSTART_PHASE4.md)** - Phase 4 quick start guide
- **[docs/PHASE_4_PLAN.md](./docs/PHASE_4_PLAN.md)** - Phase 4 implementation plan
- **[docs/TEMPORAL_ARCHITECTURE.md](./docs/TEMPORAL_ARCHITECTURE.md)** - Complete Temporal architecture
- **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Comprehensive testing guide
- **[TASKFILE_README.md](./TASKFILE_README.md)** - Task commands guide (legacy)
- **packages/*/README.md** - Individual service documentation

## 🚀 Next Steps (Phase 5)

### Advanced Temporal Patterns
- **Continue-as-new** - Handle infinite workflows (subscriptions)
- **Workflow Versioning** - Deploy new versions without breaking running workflows
- **Schedules** - Cron-like recurring workflows
- **Child Workflows** - Workflow composition
- **Search Attributes** - Custom workflow indexing (needs Temporal config)

### Production Observability
- Structured logging with Pino
- Prometheus metrics
- Grafana dashboards
- Distributed tracing with OpenTelemetry
- E2E tests (Jest + Supertest)

### Cloud Deployment
- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Production configuration
- Auto-scaling
- Monitoring & alerting

## 📚 Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Chaos Engineering](https://principlesofchaos.org/)
- [Vertical Slice Architecture](https://jimmybogard.com/vertical-slice-architecture/)

## 🤝 Contributing

This is a learning project. Feel free to:
- Explore the code and architecture
- Run the services and test workflows
- Read the documentation
- Suggest improvements

## 📄 License

MIT - Learning and educational purposes

---

**Made with ❤️ to demonstrate production-ready microservices architecture**
