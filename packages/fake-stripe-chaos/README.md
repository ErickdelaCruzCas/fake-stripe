# Fake Stripe - Chaos Payment Service

Payment processing service with **chaos engineering** for testing resilience of distributed systems.

## 🎲 Chaos Engineering

This service simulates realistic payment processing failures to test system resilience:

| Scenario | Probability | HTTP Status | Description |
|----------|-------------|-------------|-------------|
| **Success** | 40% | 200 OK | Payment processed successfully |
| **Timeout** | 30% | 408 Request Timeout | 5-second delay + timeout (simulates slow network/overloaded service) |
| **Server Error** | 20% | 500 Internal Server Error | Unhandled exception (simulates bugs) |
| **Insufficient Funds** | 10% | 402 Payment Required | Business validation failure (simulates invalid card) |

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

# Or build and run standalone
cd packages/fake-stripe-chaos
docker build -t fake-stripe-chaos .
docker run -p 3001:3001 fake-stripe-chaos
```

## 📡 API Endpoints

### Process Payment Charge

```http
POST /payment/charge
Content-Type: application/json

{
  "amount": 1000,        // Amount in cents ($10.00)
  "currency": "usd",     // Currency code
  "source": "tok_visa",  // Payment token
  "description": "Premium subscription"  // Optional
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "chargeId": "ch_1234567890abcdef",
  "amount": 1000,
  "currency": "usd",
  "status": "succeeded",
  "createdAt": "2024-01-26T10:30:00.000Z"
}
```

**Error Responses:**

- **408 Request Timeout** (30% probability - after 5s delay):
```json
{
  "success": false,
  "error": "timeout",
  "message": "Payment service timeout - request took too long to process"
}
```

- **500 Internal Server Error** (20% probability):
```json
{
  "success": false,
  "error": "internal_error",
  "message": "An internal error occurred while processing payment"
}
```

- **402 Payment Required** (10% probability):
```json
{
  "success": false,
  "error": "insufficient_funds",
  "message": "The card has insufficient funds to complete this transaction"
}
```

### Get Statistics

```http
GET /payment/stats
```

Response:
```json
{
  "totalRequests": 100,
  "successful": 40,
  "timeouts": 30,
  "errors500": 20,
  "errors402": 10,
  "successRate": "0.40",
  "distribution": {
    "timeout": "30.0%",
    "error500": "20.0%",
    "error402": "10.0%",
    "success": "40.0%"
  }
}
```

### Get Recent Requests

```http
GET /payment/stats/recent?limit=10
```

### Reset Statistics

```http
POST /payment/stats/reset
```

## 📚 API Documentation

**Swagger UI:** http://localhost:3001/api/docs

Interactive API documentation with:
- Request/response schemas
- Try it out feature
- Model definitions
- Error examples

## 🔬 Testing Resilience

### Manual Testing

```bash
# Test with cURL (execute multiple times)
for i in {1..10}; do
  curl -X POST http://localhost:3001/payment/charge \
    -H "Content-Type: application/json" \
    -d '{"amount":1000,"currency":"usd","source":"tok_visa"}' \
    && echo ""
done

# Check statistics
curl http://localhost:3001/payment/stats | jq
```

### With REST Client (VS Code)

1. Install extension: `humao.rest-client`
2. Open `requests.http` in project root
3. Click "Send Request" above each `###`
4. Execute `/payment/charge` multiple times
5. Check `/payment/stats` to verify distribution

### Expected Results

After ~100 requests, distribution should be approximately:
- 40 successful charges (200 OK)
- 30 timeouts (408)
- 20 server errors (500)
- 10 insufficient funds (402)

## 🏗️ Architecture

### Chaos Engine

**Location:** `src/chaos/chaos-engine.service.ts`

Core service that implements chaos engineering logic:
- Random scenario selection based on probability
- Simulates realistic failure patterns
- Configurable delay for timeouts
- Detailed logging for debugging

### Payment Service

**Location:** `src/payment/payment.service.ts`

Wraps business logic with chaos engineering:
- Integrates ChaosEngineService
- Records statistics for each request
- Handles error propagation
- Correlation ID support for distributed tracing

### Statistics Service

**Location:** `src/stats/stats.service.ts`

Tracks all payment requests:
- In-memory request history
- Aggregated statistics
- Recent requests view
- Reset capability for testing

## 🔍 Observability

### Correlation ID Support

Each request can include `x-correlation-id` header:

```http
POST /payment/charge
Content-Type: application/json
x-correlation-id: my-test-id-123

{...}
```

The correlation ID is:
- Extracted from request header or auto-generated
- Included in all log entries
- Returned in response header
- Used for distributed tracing

### Structured Logging

All logs are in JSON format:

```json
{
  "message": "Chaos scenario selected",
  "correlationId": "abc-123",
  "scenario": "timeout",
  "random": "0.2345"
}
```

Search logs by correlation ID:
```bash
npm run dev 2>&1 | grep "abc-123"
```

## 🧪 Use Cases

### 1. Testing Client Retry Logic

Use Fake Stripe to verify your client properly handles:
- Timeouts (should retry with exponential backoff)
- 500 errors (should retry)
- 402 errors (should NOT retry - permanent failure)

### 2. Load Testing with Chaos

Combine with load testing tools (k6, Artillery) to:
- Test system behavior under partial failures
- Verify circuit breakers work correctly
- Validate monitoring and alerting

### 3. Distributed Tracing Validation

Use correlation IDs to:
- Trace requests across multiple services
- Identify bottlenecks
- Debug production issues

### 4. Resilience Training

Educate team on:
- Realistic failure patterns
- Proper error handling
- Retry strategies
- Circuit breaker patterns

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development
PORT=3001
```

### Chaos Probabilities

Edit `src/chaos/chaos-engine.service.ts`:

```typescript
private readonly scenarios = {
  timeout: 0.30,   // 30% timeout
  error500: 0.20,  // 20% server error
  error402: 0.10,  // 10% insufficient funds
  success: 0.40,   // 40% success
};
```

### Timeout Duration

```typescript
// Default: 5 seconds
await this.delay(5000);
```

## 📊 Monitoring

### Health Check

```http
GET /payment/stats
```

If service is healthy, returns statistics.

### Metrics to Monitor

- **Success Rate:** Should be ~40%
- **Timeout Rate:** Should be ~30%
- **Error Rate:** Should be ~30% (500 + 402)
- **Average Response Time:** ~2.5s (accounting for 5s timeouts)

## 🚨 Common Issues

### Timeouts Taking Too Long

**Issue:** Client timeout < 5s
**Solution:** Increase client timeout to 6s+ to allow server timeout to occur

### Distribution Not Matching

**Issue:** After 10 requests, distribution is off
**Solution:** Need more samples (100+) for statistical accuracy

### No Logs Visible

**Issue:** Logs not appearing in console
**Solution:** Check `NODE_ENV` is set to `development`

## 📖 Learning Resources

- [Chaos Engineering Principles](https://principlesofchaos.org/)
- [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/)
- [Resilience Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/category/resiliency)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

## 🤝 Integration with Founder

In Phase 2+, Founder service will call Fake Stripe for premium features:

```
Client → Founder → Fake Stripe (chaos)
          ↓
    Retry Logic (manual)
          ↓
    Success or Failure
```

Founder must handle:
- Timeouts with retry
- 500 errors with retry
- 402 errors without retry (permanent)

## 📝 Next Steps

**Phase 3:** Integrate Temporal for reliable workflow orchestration
- Replace manual retry with Temporal retry policies
- Add Saga pattern for compensations
- Distributed tracing with workflow IDs

---

Built with ❤️ for learning resilience engineering
