# Temporal API

REST API for Temporal workflow orchestration - start workflows, query status, track progress.

## Overview

This NestJS application provides a REST API layer over Temporal workflows:
- Start user context aggregation workflows
- Start payment workflows with Saga pattern
- Query workflow status and progress
- Cancel running workflows
- View workflow execution history

## Architecture

```
Client → Temporal API (REST) → Temporal Server → Worker
         (Port 3002)            (Port 7233)       (Activities)
```

### Flow
1. Client sends HTTP request to Temporal API
2. API starts workflow via Temporal Client
3. Temporal Server schedules workflow tasks
4. Worker executes workflow and activities
5. Client polls API for status/progress/result

## Endpoints

### Start Workflows

#### Start User Context Workflow
```http
POST /api/v1/workflows/user-context
Content-Type: application/json

{
  "strategy": "parallel",
  "correlationId": "optional-correlation-id"
}

Response (202 Accepted):
{
  "workflowId": "user-context-abc123",
  "correlationId": "abc123",
  "message": "User context workflow started"
}
```

#### Start Payment Workflow
```http
POST /api/v1/workflows/payment
Content-Type: application/json

{
  "amount": 1000,
  "currency": "usd",
  "source": "tok_visa",
  "description": "Test payment",
  "correlationId": "optional-correlation-id"
}

Response (202 Accepted):
{
  "workflowId": "payment-abc123",
  "correlationId": "abc123",
  "message": "Payment workflow started"
}
```

### Query Workflows

#### Get Workflow Status
```http
GET /api/v1/workflows/:id/status

Response:
{
  "workflowId": "user-context-abc123",
  "runId": "abc123-456-789",
  "status": "RUNNING",
  "startTime": "2024-01-27T10:00:00Z",
  "closeTime": null,
  "executionTime": null
}
```

#### Get Workflow Progress (Real-time)
```http
GET /api/v1/workflows/:id/progress

Response:
{
  "location": true,
  "weather": true,
  "catFact": false,
  "completed": false
}
```

#### Get Workflow Result (Waits for completion)
```http
GET /api/v1/workflows/:id/result

Response:
{
  "location": { ... },
  "weather": { ... },
  "catFact": { ... },
  "strategy": "parallel",
  "executionTimeMs": 1234
}
```

#### Get Workflow History
```http
GET /api/v1/workflows/:id/history

Response:
{
  "workflowId": "user-context-abc123",
  "events": [
    {
      "eventId": 1,
      "eventType": "WorkflowExecutionStarted",
      "timestamp": "2024-01-27T10:00:00Z"
    },
    ...
  ]
}
```

### Manage Workflows

#### Cancel Workflow
```http
POST /api/v1/workflows/:id/cancel

Response:
{
  "workflowId": "user-context-abc123",
  "message": "Cancellation signal sent"
}
```

## Configuration

Environment variables (see `.env.example`):

```bash
NODE_ENV=development
PORT=3002
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=founder-tasks
```

## Running Locally

### Prerequisites
- Node.js 20+
- Temporal Server running (see docker-compose.yml)
- Temporal Worker running (see packages/temporal-worker)

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t temporal-api .
docker run -p 3002:3002 --env-file .env temporal-api
```

## API Documentation

### Swagger/OpenAPI
- **URL**: http://localhost:3002/api/docs
- **Features**:
  - Interactive API testing
  - Request/response schemas
  - Try-it-out functionality

### Health Check
```http
GET /health

Response:
{
  "status": "ok",
  "service": "temporal-api",
  "timestamp": "2024-01-27T10:00:00Z"
}
```

## Testing

Use the `requests.http` file with VS Code REST Client extension:

```bash
# Open requests.http in VS Code
# Click "Send Request" above each request
```

### Test Scenarios

#### 1. Successful User Context Aggregation
```http
POST /api/v1/workflows/user-context
{ "strategy": "parallel" }

# Wait 3 seconds
GET /api/v1/workflows/:id/result
```

#### 2. Workflow Cancellation
```http
POST /api/v1/workflows/user-context
{ "strategy": "sequential" }

# Immediately cancel
POST /api/v1/workflows/:id/cancel
```

#### 3. Payment with Retry
```http
POST /api/v1/workflows/payment
{ "amount": 2500, "currency": "usd", "source": "tok_visa" }

# Poll progress every 2 seconds
GET /api/v1/workflows/:id/progress
```

## Error Handling

### Workflow Not Found (404)
```http
GET /api/v1/workflows/invalid-id/status

Response (404):
{
  "statusCode": 404,
  "message": "Workflow invalid-id not found"
}
```

### Validation Error (400)
```http
POST /api/v1/workflows/payment
{ "amount": -100 }

Response (400):
{
  "statusCode": 400,
  "message": ["amount must be at least 1"],
  "error": "Bad Request"
}
```

## Monitoring

### Temporal UI
View workflows started via this API:
- **URL**: http://localhost:8080
- Search by workflow ID or correlation ID

### Logs
- HTTP request/response logging
- Temporal Client connection events
- Workflow start/completion events

## Architecture Decisions

### Why REST API over Temporal?
- **HTTP Standard**: Works with any HTTP client
- **Authentication**: Easy to add JWT/OAuth
- **Rate Limiting**: Standard HTTP middleware
- **Monitoring**: Standard HTTP metrics
- **Documentation**: OpenAPI/Swagger

### Why Async (202 Accepted)?
- Workflows may take seconds/minutes
- Client gets immediate response with workflow ID
- Client polls for status/result
- Prevents HTTP timeout issues

### Why NestJS?
- **TypeScript**: Type-safe Temporal Client usage
- **DI**: Easy to inject Temporal Client
- **Swagger**: Auto-generated API docs
- **Consistency**: Matches Founder architecture

## Development

### Adding New Workflow Endpoint

1. Add DTO in `src/workflows/dto/`:
```typescript
export class StartMyWorkflowDto {
  @IsString()
  param!: string;
}
```

2. Add method in `workflow.service.ts`:
```typescript
async startMyWorkflow(params: MyParams): Promise<string> {
  const handle = await this.client.workflow.start('myWorkflow', {
    taskQueue: this.taskQueue,
    args: [params],
    workflowId: `my-workflow-${uuid()}`,
  });
  return handle.workflowId;
}
```

3. Add endpoint in `workflow.controller.ts`:
```typescript
@Post('my-workflow')
async startMyWorkflow(@Body() dto: StartMyWorkflowDto) {
  const workflowId = await this.service.startMyWorkflow(dto);
  return { workflowId };
}
```

## Troubleshooting

### Can't connect to Temporal Server
```bash
# Check Temporal Server is running
docker ps | grep temporal

# Check connectivity
curl http://localhost:7233
```

### Workflow not executing
- Check Worker is running
- Verify task queue name matches
- Check Temporal UI for workflow status

### Timeout waiting for result
- Workflow may still be running
- Check `/status` endpoint first
- Poll `/progress` endpoint instead

## Related Packages

- **temporal-worker**: Executes workflows and activities
- **founder**: Original REST API (pre-Temporal)
- **fake-stripe-chaos**: Chaos engineering payment service

## Resources

- [Temporal Client Documentation](https://docs.temporal.io/dev-guide/typescript/foundations)
- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenAPI Specification](https://swagger.io/specification/)
