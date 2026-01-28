# Phase 4: Production Order Fulfillment Workflow

## 🎯 Objetivo
Sistema completo de fulfillment de pedidos con aprobación manual, demostrando todas las features de Temporal.

---

## 🔄 Workflow: Order Fulfillment

### Flujo Principal
```
1. Payment Authorization (hold funds)
   ↓
2. Wait for Manager Approval (Signal + Timeout)
   ↓ (approved)
3. Inventory Reservation
   ↓
4. Payment Capture (charge)
   ↓
5. Shipping Label Generation
   ↓
6. Customer Notification (success)
```

### Saga Compensation (Rollback)
```
- Manager REJECTS → Release payment hold
- Manager TIMEOUT (2 min) → Release payment hold
- Inventory fails → Release payment hold
- Payment capture fails → Release inventory
- Shipping fails → Refund payment + Release inventory
- Notification fails → Continue (non-critical)
```

---

## 📋 Features de Temporal Demostradas

### 1. **Signals** (Human-in-the-loop)
- `approveOrder` - Manager aprueba
- `rejectOrder` - Manager rechaza
- `cancelOrder` - User cancela en cualquier momento

### 2. **Queries** (Real-time state)
- `getOrderStatus` - Estado actual del pedido
- `getProgress` - Progreso % (0-100)
- `getStepDetails` - Detalles de cada paso completado

### 3. **Search Attributes** (Business queries)
- `orderId` - Custom ID
- `customerId` - Para buscar pedidos por cliente
- `orderStatus` - pending, approved, rejected, shipped, failed
- `totalAmount` - Filtrar por monto
- `createdAt` - Rango de fechas

### 4. **Activity Heartbeats**
- Shipping label generation (larga duración)
- Heartbeat cada 5s con progreso

### 5. **Activity Cancellation**
- Cancelar workflow → cancelar actividades en progreso
- Cleanup graceful

### 6. **Timeouts**
- Approval timeout: 2 minutos
- Activity timeouts: configurable por actividad
- Workflow timeout: 30 minutos

### 7. **Retry Policies**
- Payment: 3 retries, backoff 1s/2s/4s
- Inventory: 2 retries
- Shipping: 5 retries (más crítico)
- Non-retryable errors: ValidationError

### 8. **Saga Pattern**
- Compensation activities para cada paso
- Rollback automático en caso de fallo

### 9. **Idempotency**
- Side effects para operaciones no idempotentes
- Correlation ID propagation

---

## 🛠️ Endpoints Necesarios en fake-stripe-chaos

### Payment Domain (Port 3001)
```
POST /payment/authorize     - Hold funds (returns authId)
POST /payment/capture       - Capture authorized payment
POST /payment/release       - Release hold (compensation)
POST /payment/refund        - Refund captured payment (compensation)
GET  /payment/:id/status    - Check payment status
```

### Inventory Domain (Port 3001)
```
POST /inventory/reserve     - Reserve items (returns reservationId)
POST /inventory/release     - Release reservation (compensation)
GET  /inventory/:id/status  - Check reservation status
POST /inventory/check       - Check availability (no side effects)
```

### Shipping Domain (Port 3001)
```
POST /shipping/create-label - Generate label (long-running, heartbeat)
POST /shipping/cancel       - Cancel shipment (compensation)
GET  /shipping/:id/status   - Check shipment status
```

### Notification Domain (Port 3001)
```
POST /notification/send     - Send email/SMS notification
GET  /notification/:id/status - Check notification status
```

---

## 📦 Arquitectura: Vertical Slices + Hexagonal Inside

```
packages/fake-stripe-chaos/src/
├── payment/              # Payment bounded context
│   ├── domain/
│   │   ├── models/       # PaymentAuthorization, PaymentCapture
│   │   ├── ports/        # PaymentRepositoryPort
│   │   └── services/     # PaymentDomainService
│   ├── application/
│   │   ├── dto/          # AuthorizePaymentDto, CapturePaymentDto
│   │   └── use-cases/    # AuthorizePaymentUseCase
│   ├── infrastructure/
│   │   ├── adapters/     # InMemoryPaymentRepository
│   │   └── chaos/        # PaymentChaosEngine
│   └── presentation/
│       └── controllers/  # PaymentController
│
├── inventory/            # Inventory bounded context
│   ├── domain/
│   │   ├── models/       # InventoryReservation
│   │   ├── ports/        # InventoryRepositoryPort
│   │   └── services/     # InventoryDomainService
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   ├── infrastructure/
│   │   ├── adapters/
│   │   └── chaos/
│   └── presentation/
│       └── controllers/
│
├── shipping/             # Shipping bounded context
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── notification/         # Notification bounded context
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── shared/               # Cross-domain infrastructure
│   ├── chaos/            # Base ChaosEngine
│   ├── correlation/      # Correlation ID middleware
│   └── logging/          # Structured logging
│
└── app.module.ts
```

---

## 🎲 Chaos Scenarios (Casuísticas)

### Payment Authorization
- 40% Success
- 30% Insufficient funds (402)
- 20% Timeout (simulate slow bank)
- 10% Server error (500)

### Payment Capture
- 70% Success
- 20% Already captured (409)
- 10% Authorization expired (410)

### Inventory Reservation
- 50% Success
- 30% Out of stock (409)
- 10% Timeout
- 10% Server error (500)

### Shipping Label
- 60% Success (with heartbeat every 5s, 20s total)
- 20% Address validation failed (400)
- 10% Timeout (simulate long processing)
- 10% Carrier error (503)

### Notification
- 80% Success (non-critical)
- 15% Delivery failed (temporary)
- 5% Invalid recipient (400)

---

## 📊 Data Models

### Order Input
```typescript
{
  orderId: "ORD-123",
  customerId: "CUST-456",
  items: [
    { sku: "ITEM-001", quantity: 2, price: 29.99 },
    { sku: "ITEM-002", quantity: 1, price: 49.99 }
  ],
  totalAmount: 109.97,
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

### Workflow State (Query Response)
```typescript
{
  status: "awaiting_approval" | "approved" | "rejected" | "processing" | "shipped" | "failed" | "cancelled",
  progress: 60, // 0-100
  currentStep: "payment_capture",
  completedSteps: [
    {
      name: "payment_authorization",
      status: "completed",
      timestamp: "2026-01-28T10:00:00Z",
      data: { authId: "AUTH-789" }
    },
    {
      name: "manager_approval",
      status: "completed",
      timestamp: "2026-01-28T10:01:30Z",
      data: { approvedBy: "manager@company.com" }
    }
  ],
  compensations: [],
  error: null
}
```

---

## 🔄 Temporal Worker Structure

```
packages/temporal-worker/src/
├── workflows/
│   └── order-fulfillment.workflow.ts
├── activities/
│   ├── payment.activities.ts
│   ├── inventory.activities.ts
│   ├── shipping.activities.ts
│   └── notification.activities.ts
└── worker.ts
```

---

## 🚀 Implementation Steps

### Step 1: fake-stripe-chaos endpoints
1. Create domain folders (payment, inventory, shipping, notification)
2. Implement chaos engines per domain
3. Create in-memory repositories
4. Implement controllers with OpenAPI docs
5. Update docker-compose (if needed)

### Step 2: Temporal activities
1. Create activity interfaces
2. Implement activities calling fake-stripe-chaos
3. Add retry policies
4. Add heartbeats for shipping

### Step 3: Temporal workflow
1. Main workflow with Saga pattern
2. Signal handlers (approve, reject, cancel)
3. Query handlers (status, progress)
4. Search attributes
5. Timeout handling

### Step 4: Temporal API endpoints
1. POST /workflows/order - Start order workflow
2. POST /workflows/:id/approve - Approve order
3. POST /workflows/:id/reject - Reject order
4. GET /workflows/:id/status - Get status
5. POST /workflows/:id/cancel - Cancel order

### Step 5: Testing & Documentation
1. requests.http with all scenarios
2. Update TEMPORAL_ARCHITECTURE.md
3. Create SAGA_PATTERN.md
4. README updates

---

## 📝 Success Criteria

- ✅ All Temporal features demonstrated
- ✅ Saga compensation working correctly
- ✅ Human approval with timeout
- ✅ Activity heartbeats visible in Temporal UI
- ✅ Search attributes queryable
- ✅ Chaos scenarios cover all failure modes
- ✅ Fully documented with examples
- ✅ Hexagonal architecture per domain
- ✅ Production-ready error handling
