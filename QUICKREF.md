# Quick Reference - Temporal Services

## Task Commands (Recommended)

**Install Task:** https://taskfile.dev/installation/ or `brew install go-task`

```bash
# Quick Start
task up              # Start all services
task health          # Check service health
task test:workflow   # Test user context workflow
task ui              # Open Temporal UI

# Development
task dev:temporal-worker   # Run Worker locally
task logs:temporal-worker  # View Worker logs

# Workflow Management
task workflow:status -- {workflowId}
task workflow:result -- {workflowId}

# Full list
task --list
```

See `TASKFILE_README.md` for complete guide.

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Temporal API | http://localhost:3002/api/docs | REST API Swagger UI |
| Temporal UI | http://localhost:8080 | Workflow visibility |
| Founder API | http://localhost:3000/api/docs | Legacy REST API |
| Fake Stripe | http://localhost:3001/api/docs | Chaos payment service |

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f temporal-worker
docker-compose logs -f temporal-api

# Restart a service
docker-compose restart temporal-worker

# Check service health
docker-compose ps
```

## Common API Calls

### Start User Context Workflow (Parallel)
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{"strategy": "parallel"}'
```

### Start User Context Workflow (Sequential)
```bash
curl -X POST http://localhost:3002/api/v1/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{"strategy": "sequential"}'
```

### Start Payment Workflow
```bash
curl -X POST http://localhost:3002/api/v1/workflows/payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "source": "tok_visa",
    "description": "Test payment"
  }'
```

### Get Workflow Status
```bash
curl http://localhost:3002/api/v1/workflows/{workflowId}/status
```

### Get Workflow Progress
```bash
curl http://localhost:3002/api/v1/workflows/{workflowId}/progress
```

### Get Workflow Result
```bash
curl http://localhost:3002/api/v1/workflows/{workflowId}/result
```

### Cancel Workflow
```bash
curl -X POST http://localhost:3002/api/v1/workflows/{workflowId}/cancel
```

## Directory Structure

```
fake-stripe/
├── packages/
│   ├── founder/              # Phase 1: Original REST API (Port 3000)
│   ├── fake-stripe-chaos/    # Phase 2: Chaos payment service (Port 3001)
│   ├── temporal-worker/      # Phase 3: Temporal Worker
│   └── temporal-api/         # Phase 3: Temporal REST API (Port 3002)
├── docs/
│   ├── TEMPORAL_ARCHITECTURE.md  # Complete architecture guide
│   └── TESTING_GUIDE.md          # Comprehensive testing guide
├── docker-compose.yml        # All services orchestration
├── CLAUDE.md                 # Project guidance for Claude
├── PHASE3_SUMMARY.md         # Phase 3 implementation summary
└── QUICKREF.md               # This file
```

## Environment Variables

### Temporal Worker
```bash
TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=founder-tasks
OPENWEATHER_API_KEY=904c250dea7da952f578aad2312c65e5
FAKE_STRIPE_URL=http://fake-stripe-chaos:3001
```

### Temporal API
```bash
PORT=3002
TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=founder-tasks
```

## Debugging

### View Workflow in Temporal UI
1. Open http://localhost:8080
2. Click "Workflows" in sidebar
3. Search for workflow ID
4. View execution history

### Check Worker Health
```bash
docker logs temporal-worker | tail -n 50
```

### Check API Health
```bash
curl http://localhost:3002/health
```

### Inspect Database
```bash
docker exec -it temporal-postgres psql -U temporal
```

## Troubleshooting

### Worker not connecting
```bash
# Check Temporal Server
docker ps | grep temporal-server
docker logs temporal-server

# Restart Worker
docker-compose restart temporal-worker
```

### Workflow stuck
```bash
# Check Worker logs
docker logs temporal-worker

# View in Temporal UI
open http://localhost:8080

# Cancel workflow
curl -X POST http://localhost:3002/api/v1/workflows/{id}/cancel
```

### External API failures
```bash
# Test from Worker container
docker exec temporal-worker curl https://ipapi.co/json
docker exec temporal-worker curl https://catfact.ninja/fact

# Check API key
docker exec temporal-worker env | grep OPENWEATHER_API_KEY
```

## Key Workflows

### userContextWorkflow
- **Purpose**: Aggregate location, weather, cat fact
- **Strategies**: parallel (fast) or sequential (educational)
- **Retry**: 3 attempts, exponential backoff
- **Timeout**: 30 seconds per activity, 5 minutes total
- **Features**: Partial failure handling, cancellation, progress tracking

### paymentWorkflow
- **Purpose**: Process payment with Saga compensation
- **Retry**: 5 attempts for timeout/500, no retry for 402
- **Timeout**: 30 seconds
- **Features**: Saga pattern, compensation logic, audit trail

## HTTP Test Files

- `packages/temporal-api/requests.http` - Temporal API tests
- `requests.http` - Founder + Fake Stripe tests

**Use VS Code REST Client extension to execute requests**

## Documentation

- `packages/temporal-worker/README.md` - Worker documentation
- `packages/temporal-api/README.md` - API documentation
- `docs/TEMPORAL_ARCHITECTURE.md` - Complete architecture
- `docs/TESTING_GUIDE.md` - Testing scenarios
- `PHASE3_SUMMARY.md` - Implementation summary

## Useful Links

- [Temporal Docs](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript)
- [NestJS Docs](https://docs.nestjs.com/)
- [OpenAPI Spec](https://swagger.io/specification/)
