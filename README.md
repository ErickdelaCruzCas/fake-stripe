# Fake Stripe - Progressive Microservices Architecture

A comprehensive learning project demonstrating evolutionary architecture: from simple aggregator to Temporal-orchestrated microservices with chaos engineering.

> 📋 **Current Phase**: Phase 0 - Cleanup & Setup ✅
> See [CLAUDE.md](./CLAUDE.md) for detailed implementation plan

## Project Vision

This project evolves through 5 distinct phases, each building on the previous:

```
Phase 0: Cleanup       →  Phase 1: Aggregator    →  Phase 2: Chaos         →  Phase 3: Temporal      →  Phase 4: Observability
(Monorepo Setup)          (Hexagonal Arch)          (Microservices)           (Workflows)               (Testing + Logging)
```

### Phase Overview

| Phase | Goal | Architecture | Key Tech |
|-------|------|--------------|----------|
| **0** | Monorepo setup | Clean slate | npm workspaces |
| **1** | API aggregator | Hexagonal | NestJS + 3 external APIs |
| **2** | Add payment service | Microservices | Fake Stripe + Chaos Engine |
| **3** | Workflow orchestration | Temporal Workers | Temporal SDK + Activities |
| **4** | Production-ready | Full observability | Pino + Correlation IDs + E2E tests |

## Tech Stack

- **NestJS** - TypeScript framework for microservices
- **Temporal** - Workflow orchestration (Phase 3+)
- **Docker** - Containerization and service orchestration
- **Axios** - HTTP client for external APIs
- **RxJS** - Reactive programming (Phase 1)
- **Pino** - Structured logging (Phase 4)
- **Jest** - Testing framework (Phase 4)
- **Swagger/OpenAPI** - API documentation (All phases)

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- npm (workspaces support)
- VS Code with REST Client extension (optional)

## Monorepo Structure

```
fake-stripe/
├── packages/
│   ├── founder/                    # Phase 1: User context aggregator
│   ├── fake-stripe-chaos/          # Phase 2: Payment service with chaos
│   └── temporal-orchestrator/      # Phase 3: Temporal workflows
├── requests.http                   # REST Client file (all API calls)
├── docker-compose.yml              # Evolves with each phase
├── package.json                    # Root workspace config
├── tsconfig.json                   # Shared TypeScript config
├── CLAUDE.md                       # Implementation guide for Claude Code
├── PROJECT_STATUS.md               # Current phase tracking
└── README.md                       # This file
```

## Quick Start (Phase 0 - Current)

### 1. Install Dependencies

```bash
npm install
```

### 2. Project Status

Currently in **Phase 0** - monorepo structure ready for Phase 1 implementation.

**Next steps:**
- Implement Phase 1: Founder service (API aggregator)
- See [CLAUDE.md](./CLAUDE.md) for detailed implementation plan

## REST Client Usage

This project includes a `requests.http` file for manual API testing via VS Code's REST Client extension.

**Setup:**
1. Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension
2. Open `requests.http` in VS Code
3. Click "Send Request" above each `###` separator
4. View responses in sidebar

**Benefits:**
- No Postman needed
- Version controlled with code
- Easy to share and reproduce API calls

## Phase Details

### Phase 1: Founder - User Context Aggregator

**Goal:** Build a production-grade API aggregator using hexagonal architecture

**Features:**
- Aggregates data from 3 external APIs (Location + Weather + Cat Facts)
- 3 concurrency strategies: Promise.allSettled, RxJS, Async Sequential
- Hexagonal architecture (Ports & Adapters)
- Swagger documentation
- Docker deployment

**Endpoints:**
- `GET /api/v1/user-context?strategy=promise-allsettled`
- `GET /health`

**Status:** 🔜 Pending

---

### Phase 2: Fake Stripe with Chaos Engineering

**Goal:** Add second microservice simulating payment gateway with controlled failures

**Features:**
- Chaos Engine: 40% success, 30% timeout, 20% error 500, 10% error 402
- Payment processing simulation
- Founder integration for premium features
- Statistics endpoint

**Endpoints:**
- `POST /payment/charge`
- `GET /payment/stats`
- `GET /api/v1/user-context-premium` (Founder)

**Status:** 📋 Planned

---

### Phase 3: Temporal Orchestration

**Goal:** Refactor to Temporal workflows with durable execution

**Features:**
- Migrate Founder adapters → Temporal Activities
- Workflow-based orchestration
- Saga pattern with compensations
- Signals & Queries for real-time control
- Temporal UI for workflow visibility

**Components:**
- Temporal Server + PostgreSQL (Docker)
- Temporal Worker (ex-Founder logic)
- Temporal Client API (REST endpoints)

**Endpoints:**
- `POST /workflows/user-context`
- `GET /workflows/:id/status`
- `POST /workflows/:id/cancel`

**Status:** 📋 Planned

---

### Phase 4: Production Observability

**Goal:** Add comprehensive testing and observability

**Features:**
- E2E automated tests (Jest + Supertest)
- Structured logging with Pino
- Correlation IDs across services
- Optional: Grafana + Loki for log aggregation
- Full request traceability

**Test Coverage:**
- Founder: User context aggregation
- Fake Stripe: Chaos distribution validation
- Temporal: Workflow execution and compensations

**Status:** 📋 Planned

## Development Workflow

### Phase 1 (When implemented)

```bash
# Start Founder service
docker-compose up -d founder

# View logs
docker-compose logs -f founder

# Test with REST Client
# Open requests.http and click "Send Request"
```

### Phase 2 (Future)

```bash
# Start both services
docker-compose up -d founder fake-stripe-chaos

# Test premium endpoint
curl http://localhost:3000/api/v1/user-context-premium
```

### Phase 3 (Future)

```bash
# Start full stack
docker-compose up -d

# Open Temporal UI
open http://localhost:8080

# Start workflow via API
curl -X POST http://localhost:3002/workflows/user-context \
  -H "Content-Type: application/json" \
  -d '{"premium": true}'
```

## Learning Objectives

By completing all phases, you'll learn:

1. **Hexagonal Architecture** - Clean separation of domain, application, and infrastructure
2. **Concurrency Patterns** - Promise.allSettled, RxJS, async/await strategies
3. **Chaos Engineering** - Controlled failure simulation and resilience
4. **Microservices** - HTTP communication, service boundaries, retry logic
5. **Temporal Workflows** - Durable execution, activities, signals, queries
6. **Saga Pattern** - Distributed transactions with compensations
7. **Observability** - Structured logging, correlation IDs, distributed tracing
8. **Testing** - E2E testing strategies for microservices

## Architecture Evolution

### Phase 1: Simple Aggregator
```
Client → NestJS API → [IPApi, Weather, CatFact] (parallel)
```

### Phase 2: Microservices
```
Client → Founder → External APIs
              ↓
         Fake Stripe (with chaos)
```

### Phase 3: Temporal Orchestration
```
Client → Temporal Client API
              ↓
         Temporal Server
              ↓
         Temporal Worker (Activities)
              ↓
         [External APIs, Fake Stripe]
```

## External APIs Used

| API | Purpose | Authentication | Phase |
|-----|---------|----------------|-------|
| [IPApi](https://ipapi.co/) | Geolocation | None | 1 |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather data | API Key (hardcoded) | 1 |
| [Cat Facts](https://catfact.ninja/) | Entertainment | None | 1 |
| Fake Stripe | Payment simulation | Internal | 2 |

## Configuration

Each package has its own `.env` file. Example:

```bash
# packages/founder/.env
NODE_ENV=development
PORT=3000
OPENWEATHER_API_KEY=your_dev_key_here
AGGREGATION_STRATEGY=promise-allsettled
```

## Documentation

- **CLAUDE.md** - Detailed implementation guide for each phase
- **PROJECT_STATUS.md** - Current progress and phase checklist
- **requests.http** - All API endpoints with examples
- **Swagger UI** - Auto-generated API docs (per service)

## Contributing

This is a learning project. To implement the next phase:

1. Read [CLAUDE.md](./CLAUDE.md) for the phase plan
2. Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current phase
3. Follow the architecture and patterns established
4. Update documentation as you go

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Chaos Engineering](https://principlesofchaos.org/)

## License

MIT - Learning and educational purposes
