# Fake Stripe - Order Fulfillment Chaos Service v2.0

Complete **order fulfillment service** with **chaos engineering** for testing resilience of distributed Temporal workflows.

## 🏗️ Architecture: Vertical Slices + Hexagonal

Phase 4 evolution with **4 bounded contexts**, each with its own hexagonal architecture:

```
fake-stripe-chaos/
├── payment/              # Payment Domain
│   ├── domain/           # Pure business logic
│   ├── application/      # Use cases & DTOs
│   ├── infrastructure/   # Chaos, repository
│   └── presentation/     # REST controllers
│
├── inventory/            # Inventory Domain
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── shipping/             # Shipping Domain (long-running)
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
└── notification/         # Notification Domain (non-critical)
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

## 🎲 Chaos Engineering - Per Domain

Each domain has specific failure scenarios to test real-world resilience:

### 💳 Payment Domain

| Operation | Success | Scenarios |
|-----------|---------|-----------|
| **Authorize** | 40% | 30% insufficient funds, 20% timeout, 10% error |
| **Capture** | 70% | 20% already captured, 10% expired |
| **Release** | 85% | 10% already released, 5% error |
| **Refund** | 75% | 15% timeout, 10% error |

### 📦 Inventory Domain

| Operation | Success | Scenarios |
|-----------|---------|-----------|
| **Reserve** | 50% | 30% out of stock, 10% timeout, 10% error |
| **Release** | 90% | 10% error |

### 🚚 Shipping Domain

| Operation | Success | Scenarios |
|-----------|---------|-----------|
| **Create Label** | 60% | 20% address error, 10% timeout (20s), 10% carrier error |
| **Cancel** | 95% | 5% error |

**Note:** Shipping label generation is **long-running (~20s)** with heartbeat support for Temporal activities.

### 📧 Notification Domain

| Operation | Success | Scenarios |
|-----------|---------|-----------|
| **Send** | 80% | 15% delivery failed, 5% invalid recipient |

**Note:** Notifications are **non-critical** - failures don't trigger Saga rollback.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# From project root
docker-compose up fake-stripe-chaos

# Or standalone
cd packages/fake-stripe-chaos
docker build -t fake-stripe-chaos .
docker run -p 3001:3001 fake-stripe-chaos
```

## 📡 API Endpoints

### Payment Domain

```http
# 1. Authorize Payment (hold funds)
POST /payment/authorize
{
  "amount": 10000,
  "currency": "usd",
  "orderId": "ORD-123",
  "customerId": "CUST-456"
}

# 2. Capture Payment (charge funds)
POST /payment/capture
{
  "authId": "auth_abc123"
}

# 3. Release Payment (compensation)
POST /payment/release
{
  "authId": "auth_abc123"
}

# 4. Refund Payment (compensation)
POST /payment/refund
{
  "authId": "auth_abc123",
  "amount": 5000,
  "reason": "Customer requested"
}

# 5. Get Chaos Distribution
GET /payment/chaos/distribution
```

### Inventory Domain

```http
# 1. Reserve Inventory
POST /inventory/reserve
{
  "items": [
    { "sku": "ITEM-001", "quantity": 2 }
  ],
  "orderId": "ORD-123"
}

# 2. Release Inventory (compensation)
POST /inventory/release
{
  "reservationId": "res_xyz789"
}
```

### Shipping Domain

```http
# 1. Create Shipping Label (long-running ~20s)
POST /shipping/create-label
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US"
  },
  "carrier": "UPS",
  "orderId": "ORD-123"
}

# 2. Cancel Shipping (compensation)
POST /shipping/cancel
{
  "labelId": "lbl_abc123"
}
```

### Notification Domain

```http
# 1. Send Notification
POST /notification/send
{
  "type": "email",
  "recipient": "customer@example.com",
  "subject": "Your order has shipped!",
  "message": "Order ORD-123 shipped...",
  "orderId": "ORD-123"
}
```

## 📚 API Documentation

**Swagger UI:** http://localhost:3001/api/docs

Interactive documentation with:
- All 4 domains documented
- Chaos scenarios per endpoint
- Request/response schemas
- Try it out feature

## 🔄 Order Fulfillment Flow

### Happy Path

```
1. POST /payment/authorize    → authId
   ↓ (Wait for manager approval in Temporal)
2. POST /inventory/reserve     → reservationId
   ↓
3. POST /payment/capture       → charged
   ↓
4. POST /shipping/create-label → labelId (20s with heartbeat)
   ↓
5. POST /notification/send     → notification sent
   ✅ ORDER COMPLETE
```

### Failure + Saga Compensation

```
1. POST /payment/authorize     → authId ✅
2. POST /inventory/reserve     → reservationId ✅
3. POST /payment/capture       → charged ✅
4. POST /shipping/create-label → ❌ FAILS (address error)

   🔄 COMPENSATION (Saga Rollback):
   ├─ POST /inventory/release  → inventory freed
   └─ POST /payment/refund     → payment refunded
```

## 🧪 Testing with Temporal

This service is designed for **Temporal Order Fulfillment Workflow** testing:

1. **Signals:** Manager approval/rejection
2. **Queries:** Real-time order status
3. **Search Attributes:** Find orders by customer/status/amount
4. **Activity Heartbeats:** Shipping label progress tracking
5. **Activity Cancellation:** Cancel shipment if workflow cancelled
6. **Timeouts:** Approval timeout (2 min) triggers release
7. **Retry Policies:** Different per domain
8. **Saga Pattern:** Automatic compensation on failure
9. **Idempotency:** Safe activity retries

### Testing Scenarios

```bash
# Test all scenarios by executing requests multiple times
# See requests.http for complete test collection

# 1. Test Happy Path (execute each step manually)
# 2. Test Saga Rollback (force shipping failure)
# 3. Test Timeout Scenarios (wait for timeout chaos)
# 4. Test Retry Policies (retry on 500/408 errors)
# 5. Test Long-Running Activities (shipping with heartbeat)
```

## 🏗️ Hexagonal Architecture

Each domain follows:

```
Domain Layer (Pure Business Logic)
├── models/       # Entities (PaymentAuthorization, InventoryReservation)
├── ports/        # Interfaces (RepositoryPort)
└── services/     # Domain logic (validation, factory methods)

Application Layer (Orchestration)
├── dto/          # Request/response objects
└── use-cases/    # Orchestrate domain + infrastructure

Infrastructure Layer (Technical Details)
├── adapters/     # In-memory repositories
└── chaos/        # Chaos engines per domain

Presentation Layer (API)
└── controllers/  # REST endpoints
```

**Benefits:**
- ✅ Testable (mock repositories via ports)
- ✅ Swappable implementations (in-memory → PostgreSQL)
- ✅ Domain isolated from framework
- ✅ Clear separation of concerns

## 🔍 Observability

### Correlation ID Support

```http
POST /payment/authorize
x-correlation-id: my-order-123

{...}
```

Correlation ID is:
- Auto-generated if not provided
- Propagated through all logs
- Returned in response headers
- Used for distributed tracing in Temporal

### Structured Logging

All logs in JSON format:

```json
{
  "message": "Authorizing payment",
  "correlationId": "abc-123",
  "amount": 10000,
  "currency": "usd"
}
```

Search logs:
```bash
npm run dev 2>&1 | grep "abc-123"
```

## 📊 Statistics & Monitoring

```http
# Get payment statistics (legacy)
GET /payment/stats

# Get recent requests
GET /payment/stats/recent

# Reset statistics
POST /payment/stats/reset
```

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development
PORT=3001
```

### Chaos Probabilities

Each domain has configurable chaos scenarios in:
- `payment/infrastructure/chaos/payment-chaos.engine.ts`
- `inventory/infrastructure/chaos/inventory-chaos.engine.ts`
- `shipping/infrastructure/chaos/shipping-chaos.engine.ts`
- `notification/infrastructure/chaos/notification-chaos.engine.ts`

## 📝 Data Models

### Order Input (for Temporal Workflow)

```typescript
{
  orderId: "ORD-123",
  customerId: "CUST-456",
  items: [
    { sku: "ITEM-001", quantity: 2, price: 29.99 }
  ],
  totalAmount: 59.98,
  shippingAddress: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    country: "US"
  },
  customerEmail: "customer@example.com"
}
```

## 🚨 Common Issues

### Shipping Takes 20 Seconds

**Expected:** Shipping label generation is intentionally slow to demonstrate:
- Activity heartbeats
- Long-running operations
- Progress tracking

### Chaos Scenarios Not Matching Exactly

**Expected:** Probabilities are statistical - need 100+ requests for accurate distribution.

### Compensation Not Happening

**Cause:** Manual testing - compensations are automatic in Temporal workflows.

## 📖 Learning Resources

- [Temporal Workflows](https://docs.temporal.io/workflows)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Chaos Engineering](https://principlesofchaos.org/)

## 🤝 Integration with Temporal

```
Temporal Workflow (temporal-worker)
  ↓
Activities Call → fake-stripe-chaos
  - Payment Activities → /payment/*
  - Inventory Activities → /inventory/*
  - Shipping Activities → /shipping/* (with heartbeat)
  - Notification Activities → /notification/*

On Failure → Saga Compensation
  - Refund payment
  - Release inventory
  - Cancel shipment
```

## 📝 Next Steps (Phase 5)

- [ ] Add human-in-the-loop approval workflow
- [ ] Implement continue-as-new for subscriptions
- [ ] Add activity heartbeat details visibility
- [ ] Enhanced search attributes
- [ ] Workflow versioning examples

---

**Phase 4 Complete** ✅
Built with ❤️ for learning Temporal, Saga, and Hexagonal Architecture
