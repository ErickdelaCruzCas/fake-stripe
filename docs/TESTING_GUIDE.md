# Testing Guide - Temporal Implementation

Complete testing guide for Phase 3: Temporal Orchestration.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ installed (for local development)
- VS Code with REST Client extension (for HTTP testing)

## Starting the System

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# Expected output:
# - temporal-server (healthy)
# - temporal-postgres (healthy)
# - temporal-ui (running)
# - temporal-worker (running)
# - temporal-api (healthy)
# - founder-service (healthy)
# - fake-stripe-chaos-service (healthy)
```

### Option 2: Local Development

```bash
# Terminal 1: Temporal Server (via Docker)
docker-compose up -d temporal temporal-postgres temporal-ui

# Terminal 2: Temporal Worker
cd packages/temporal-worker
npm install
npm run dev

# Terminal 3: Temporal API
cd packages/temporal-api
npm install
npm run dev

# Terminal 4: Fake Stripe (for payment tests)
cd packages/fake-stripe-chaos
npm run dev
```

## Verification Checklist

### 1. Infrastructure Health

```bash
# Temporal Server
curl http://localhost:7233
# Should connect (may return empty response)

# Temporal UI
open http://localhost:8080
# Should show Temporal UI

# Temporal API
curl http://localhost:3002/health
# Should return: {"status":"ok","service":"temporal-api"}

# PostgreSQL
docker exec -it temporal-postgres pg_isready -U temporal
# Should return: accepting connections
```

### 2. Service Logs

```bash
# Check Worker logs (should show "Worker started successfully")
docker logs temporal-worker

# Check API logs (should show "Temporal API started successfully")
docker logs temporal-api

# Check Temporal Server logs
docker logs temporal-server
```

## Test Scenarios

### Scenario 1: Successful User Context Workflow

**Goal**: Verify parallel workflow execution with all APIs succeeding.

**Steps**:

1. Start workflow:
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "parallel",
    "correlationId": "test-001"
  }'
```

2. Note the `workflowId` from response (e.g., `user-context-test-001`)

3. Check workflow status:
```bash
curl http://localhost:3002/api/v1/workflows/user-context-test-001/status
```

4. Check real-time progress:
```bash
curl http://localhost:3002/api/v1/workflows/user-context-test-001/progress
```

5. Get final result (wait ~2-3 seconds):
```bash
curl http://localhost:3002/api/v1/workflows/user-context-test-001/result
```

**Expected Result**:
```json
{
  "location": {
    "ip": "1.2.3.4",
    "city": "San Francisco",
    "country": "US",
    "latitude": 37.7749,
    "longitude": -122.4194,
    ...
  },
  "weather": {
    "description": "clear sky",
    "temperature": 18.5,
    "humidity": 65,
    ...
  },
  "catFact": {
    "catFact": "Cats sleep 70% of their lives.",
    "source": "catfact.ninja"
  },
  "strategy": "parallel",
  "executionTimeMs": 1234
}
```

**Verification**:
- ✅ All three fields (location, weather, catFact) have data
- ✅ executionTimeMs is < 3000 (parallel is fast)
- ✅ Temporal UI shows completed workflow

### Scenario 2: Sequential Strategy

**Goal**: Verify sequential workflow execution (slower, educational).

**Steps**:

1. Start workflow with sequential strategy:
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "sequential",
    "correlationId": "test-sequential-001"
  }'
```

2. Monitor progress (poll every second):
```bash
# Watch progress update in real-time
watch -n 1 curl http://localhost:3002/api/v1/workflows/user-context-test-sequential-001/progress
```

**Expected Progress**:
```json
// After 1 second
{ "location": true, "weather": false, "catFact": false, "completed": false }

// After 2 seconds
{ "location": true, "weather": true, "catFact": false, "completed": false }

// After 3 seconds
{ "location": true, "weather": true, "catFact": true, "completed": true }
```

**Verification**:
- ✅ Progress updates incrementally
- ✅ executionTimeMs is > 3000 (sequential is slower)

### Scenario 3: Workflow Cancellation

**Goal**: Verify signal-based cancellation.

**Steps**:

1. Start sequential workflow (slower, easier to cancel):
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "sequential",
    "correlationId": "test-cancel-001"
  }'
```

2. Immediately cancel (within 1 second):
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context-test-cancel-001/cancel
```

3. Check status:
```bash
curl http://localhost:3002/api/v1/workflows/user-context-test-cancel-001/status
```

**Expected Result**:
- Status shows "FAILED" or "CANCELLED"
- Error message: "Workflow cancelled by user"

**Verification in Temporal UI**:
- Go to http://localhost:8080
- Search for workflow ID
- Should show cancellation signal in event history

### Scenario 4: Partial Failure Handling

**Goal**: Verify workflow continues with partial failures.

**Note**: This requires simulating API failures. For now, verify in logs that activities retry on transient failures.

**Steps**:

1. Start workflow:
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{"strategy": "parallel"}'
```

2. Check Worker logs for retry attempts:
```bash
docker logs temporal-worker | grep -i retry
```

**Expected**:
- If an external API is temporarily down, activities retry
- Workflow still completes with null for failed service

### Scenario 5: Payment Workflow (Chaos Engineering)

**Goal**: Verify Saga pattern with payment compensation.

**Steps**:

1. Start payment workflow:
```bash
curl -X POST http://localhost:3002/api/v1/workflows/payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "source": "tok_visa",
    "description": "Test payment",
    "correlationId": "payment-test-001"
  }'
```

2. Monitor progress:
```bash
curl http://localhost:3002/api/v1/workflows/payment-payment-test-001/progress
```

3. Get result:
```bash
curl http://localhost:3002/api/v1/workflows/payment-payment-test-001/result
```

**Expected Results (Chaos)**:

**Scenario A: Success (40% chance)**
```json
{
  "charge": {
    "id": "ch_123456",
    "status": "succeeded",
    "amount": 1000,
    ...
  },
  "compensated": false,
  "attempts": 1
}
```

**Scenario B: Timeout/500 Error (50% chance)**
- Workflow retries automatically (up to 5 times)
- Check Temporal UI for retry history
- Eventually succeeds or fails with compensation

**Scenario C: Payment Declined (10% chance)**
```json
{
  "error": "Payment declined: Insufficient funds",
  "compensated": true,
  "attempts": 1
}
```

**Verification**:
- ✅ Check Fake Stripe stats: `curl http://localhost:3001/payment/stats`
- ✅ Verify retry attempts in Temporal UI
- ✅ Compensation executed on failure (check Worker logs)

### Scenario 6: Workflow History Inspection

**Goal**: Verify full workflow history available.

**Steps**:

1. Run any workflow to completion

2. Get history:
```bash
curl http://localhost:3002/api/v1/workflows/user-context-test-001/history
```

**Expected Result**:
```json
{
  "workflowId": "user-context-test-001",
  "events": [
    {
      "eventId": 1,
      "eventType": "WorkflowExecutionStarted",
      "timestamp": "2024-01-27T10:00:00Z"
    },
    {
      "eventId": 2,
      "eventType": "ActivityTaskScheduled",
      "timestamp": "2024-01-27T10:00:01Z"
    },
    ...
  ]
}
```

**Verification in Temporal UI**:
- Open http://localhost:8080
- Search for workflow ID
- Click on workflow
- View complete event history with all activity executions

## Performance Testing

### Parallel vs Sequential

**Test**:
```bash
# Run 10 parallel workflows
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/v1/workflows/user-context \
    -H "Content-Type: application/json" \
    -d "{\"strategy\": \"parallel\", \"correlationId\": \"perf-parallel-$i\"}"
done

# Run 10 sequential workflows
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/v1/workflows/user-context \
    -H "Content-Type: application/json" \
    -d "{\"strategy\": \"sequential\", \"correlationId\": \"perf-sequential-$i\"}"
done
```

**Expected**:
- Parallel: ~1.5-2 seconds per workflow
- Sequential: ~3-4 seconds per workflow

### Load Testing

**Test**:
```bash
# Start 100 concurrent workflows
for i in {1..100}; do
  curl -X POST http://localhost:3002/api/v1/workflows/user-context \
    -H "Content-Type: application/json" \
    -d "{\"correlationId\": \"load-test-$i\"}" &
done
wait
```

**Verification**:
- All workflows should complete successfully
- Check Temporal UI for workflow count
- Monitor Worker CPU/memory usage

## Troubleshooting

### Issue: Worker not connecting to Temporal Server

**Symptoms**:
- Worker logs show "Connection refused"
- No workflows executing

**Solution**:
```bash
# Check Temporal Server is running
docker ps | grep temporal-server

# Check Temporal Server logs
docker logs temporal-server

# Verify network connectivity
docker exec temporal-worker ping temporal -c 3

# Restart Worker
docker-compose restart temporal-worker
```

### Issue: Activities timing out

**Symptoms**:
- Workflows show "Activity timeout"
- External API calls failing

**Solution**:
```bash
# Check external API connectivity from Worker
docker exec temporal-worker ping ipapi.co -c 3
docker exec temporal-worker curl https://ipapi.co/json

# Check Worker environment variables
docker exec temporal-worker env | grep OPENWEATHER_API_KEY

# Increase activity timeout if needed (edit workflow retry policy)
```

### Issue: Workflow stuck in "Running" state

**Symptoms**:
- Workflow never completes
- No progress updates

**Solution**:
```bash
# Check Worker is running
docker ps | grep temporal-worker

# Check Worker logs for errors
docker logs temporal-worker | grep -i error

# Check Temporal UI for event history
open http://localhost:8080

# Cancel stuck workflow
curl -X POST http://localhost:3002/api/v1/workflows/{workflowId}/cancel
```

### Issue: Temporal UI not accessible

**Symptoms**:
- http://localhost:8080 not loading

**Solution**:
```bash
# Check Temporal UI container
docker ps | grep temporal-ui

# Check Temporal UI logs
docker logs temporal-ui

# Restart Temporal UI
docker-compose restart temporal-ui
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Remove all Docker resources
docker-compose down -v --remove-orphans
```

## Success Criteria

Phase 3 implementation is successful if:

- ✅ All 5 Docker services start healthy
- ✅ Temporal UI accessible at http://localhost:8080
- ✅ User context workflow completes successfully (parallel + sequential)
- ✅ Payment workflow executes with Saga pattern
- ✅ Workflow cancellation works via signals
- ✅ Real-time progress tracking via queries
- ✅ Partial failures handled gracefully
- ✅ Full workflow history visible in Temporal UI
- ✅ Retry policies work (verify in UI)
- ✅ Correlation IDs propagate through all activities

## Next Steps

After successful testing:

1. Write integration tests for workflows
2. Add Prometheus metrics to Worker
3. Set up alerting for workflow failures
4. Implement advanced patterns (child workflows, schedules)
5. Performance tuning and optimization
