# 🚀 QUICKSTART - Phase 4 Order Fulfillment

Guía rápida para probar el Order Fulfillment Workflow con Docker Compose.

## 📋 Prerequisitos

- Docker y Docker Compose instalados
- VS Code con extensión "REST Client" (opcional, para testing)

## 🏁 Paso 1: Iniciar Todos los Servicios

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# O ver logs de servicios específicos
docker-compose logs -f temporal-worker temporal-api fake-stripe-chaos
```

**Servicios que se inician:**
- ✅ `fake-stripe-chaos` - Port 3001 (4 dominios: payment, inventory, shipping, notification)
- ✅ `temporal-postgres` - Port 5432 (base de datos)
- ✅ `temporal` - Port 7233 (server)
- ✅ `temporal-ui` - Port 8080 (UI para monitorear workflows)
- ✅ `temporal-worker` - Ejecuta workflows y activities
- ✅ `temporal-api` - Port 3002 (REST API para iniciar workflows)
- 📦 `founder` - Port 3000 (opcional, Phase 1-2)

## ✅ Paso 2: Verificar que Todo Funciona

```bash
# Health checks
curl http://localhost:3001/payment/stats  # Fake Stripe
curl http://localhost:3002/health         # Temporal API
curl http://localhost:8080                # Temporal UI

# Ver servicios corriendo
docker-compose ps
```

**Esperado:**
```
NAME                    STATUS              PORTS
fake-stripe-chaos       Up (healthy)        0.0.0.0:3001->3001/tcp
temporal-api            Up (healthy)        0.0.0.0:3002->3002/tcp
temporal-server         Up (healthy)        0.0.0.0:7233->7233/tcp
temporal-ui             Up                  0.0.0.0:8080->8080/tcp
temporal-worker         Up
temporal-postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
```

## 🧪 Paso 3: Ejecutar tu Primer Workflow

### Opción A: Con cURL

```bash
# 1. Iniciar un pedido (Happy Path - auto-approve)
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-DOCKER-001",
    "customerId": "CUST-DOCKER-001",
    "items": [
      {
        "sku": "ITEM-001",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalAmount": 59.98,
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "customerEmail": "customer@example.com",
    "requiresApproval": false
  }'

# 2. Consultar el status (reemplaza WORKFLOW_ID con el ID de la respuesta)
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-DOCKER-001/status

# 3. Ver progreso (0-100%)
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-DOCKER-001/progress
```

### Opción B: Con REST Client (VS Code)

1. Abre `packages/temporal-api/requests-order.http`
2. Modifica la URL base si es necesario: `@baseUrl = http://localhost:3002`
3. Ejecuta cualquier scenario (Scenario 1 es el más simple)

## 🎯 Paso 4: Monitorear en Temporal UI

1. Abre navegador: **http://localhost:8080**
2. Ve a "Workflows"
3. Busca workflows con:
   - Workflow ID: `order-fulfillment-ORD-DOCKER-001`
   - Workflow Type: `orderFulfillmentWorkflow`
4. Click en un workflow para ver:
   - ✅ Execution history completa
   - ✅ Activity details (incluyendo heartbeats de shipping)
   - ✅ Signals recibidos
   - ✅ Queries ejecutadas
   - ✅ Input/Output de cada actividad

## 📊 Paso 5: Probar Diferentes Escenarios

### Scenario 1: Happy Path (Ya lo probaste)
```bash
# Workflow completo sin errores
# Verás: authorize → approve → reserve → capture → shipping → notification
```

### Scenario 2: Con Aprobación Manual

```bash
# 1. Iniciar pedido que REQUIERE aprobación
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-APPROVAL-001",
    "customerId": "CUST-002",
    "items": [{"sku": "ITEM-001", "quantity": 1, "price": 99.99}],
    "totalAmount": 99.99,
    "shippingAddress": {...},
    "customerEmail": "vip@example.com",
    "requiresApproval": true
  }'

# 2. Ver status (debe estar en "pending_approval")
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-APPROVAL-001/status

# 3. Aprobar el pedido (envía signal)
curl -X POST http://localhost:3002/order/order-fulfillment-ORD-APPROVAL-001/approve

# 4. Ver status de nuevo (debe estar en "processing")
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-APPROVAL-001/status
```

### Scenario 3: Cancelación + Saga Rollback

```bash
# 1. Iniciar pedido
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-CANCEL-001", ...}'

# 2. Esperar unos segundos (para que complete algunos pasos)
sleep 10

# 3. Cancelar el pedido
curl -X POST http://localhost:3002/order/order-fulfillment-ORD-CANCEL-001/cancel

# 4. Ver compensaciones ejecutadas
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-CANCEL-001/status | jq '.compensations'
```

### Scenario 4: Chaos Testing (Ejecutar Múltiples Veces)

```bash
# Ejecuta esto 10 veces para ver diferentes fallos de chaos
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/v1/order \
    -H "Content-Type: application/json" \
    -d "{
      \"orderId\": \"ORD-CHAOS-$i\",
      \"customerId\": \"CUST-CHAOS-$i\",
      \"items\": [{\"sku\": \"ITEM-001\", \"quantity\": 1, \"price\": 29.99}],
      \"totalAmount\": 29.99,
      \"shippingAddress\": {
        \"street\": \"123 Test St\",
        \"city\": \"Chicago\",
        \"state\": \"IL\",
        \"zip\": \"60601\",
        \"country\": \"US\"
      },
      \"customerEmail\": \"chaos@example.com\",
      \"requiresApproval\": false
    }"
  echo "\n---\n"
  sleep 2
done

# Verás diferentes fallos:
# - 30% Payment insufficient funds
# - 30% Inventory out of stock
# - 20% Shipping address error
# - Etc.
```

## 🔍 Paso 6: Explorar APIs con Swagger

Abre en tu navegador:

- **Temporal API**: http://localhost:3002/api/docs
- **Fake Stripe API**: http://localhost:3001/api/docs

Puedes ejecutar requests directamente desde Swagger UI.

## 🧹 Detener Todo

```bash
# Detener servicios (mantiene datos)
docker-compose stop

# Detener y eliminar contenedores (mantiene volúmenes)
docker-compose down

# Eliminar TODO (incluyendo base de datos)
docker-compose down -v
```

## 🐛 Troubleshooting

### Problema: "Worker not registered"
```bash
# Reiniciar worker
docker-compose restart temporal-worker

# Ver logs
docker-compose logs -f temporal-worker
```

### Problema: "Cannot connect to Temporal"
```bash
# Verificar que Temporal está healthy
docker-compose ps temporal

# Si no está healthy, reiniciar
docker-compose restart temporal
```

### Problema: "Fake Stripe no responde"
```bash
# Verificar servicio
docker-compose ps fake-stripe-chaos

# Ver logs
docker-compose logs -f fake-stripe-chaos

# Test directo
curl http://localhost:3001/payment/chaos/distribution
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo worker y API
docker-compose logs -f temporal-worker temporal-api

# Solo fake-stripe
docker-compose logs -f fake-stripe-chaos
```

## 📚 Recursos Útiles

- **Temporal UI**: http://localhost:8080
- **Temporal API Docs**: http://localhost:3002/api/docs
- **Fake Stripe Docs**: http://localhost:3001/api/docs
- **Order Workflow Tests**: `packages/temporal-api/requests-order.http`
- **Fake Stripe Tests**: `packages/fake-stripe-chaos/requests.http`

## 🎯 Flujo Completo Ejemplo

```bash
# 1. Levantar servicios
docker-compose up -d

# 2. Esperar a que estén healthy (~30s)
docker-compose ps

# 3. Iniciar pedido
curl -X POST http://localhost:3002/api/v1/order \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "orderId": "ORD-TEST-001",
  "customerId": "CUST-001",
  "items": [{"sku": "ITEM-001", "quantity": 1, "price": 29.99}],
  "totalAmount": 29.99,
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
EOF

# 4. Ver progreso cada 5s
watch -n 5 'curl -s http://localhost:3002/order/order-fulfillment-ORD-TEST-001/progress | jq'

# 5. Ver en Temporal UI: http://localhost:8080

# 6. Cuando termine, ver resultado final
curl http://localhost:3002/api/v1/order/order-fulfillment-ORD-TEST-001/status | jq

# 7. Detener
docker-compose down
```

## ✅ Checklist de Features Temporal

Después de probar, deberías haber visto:

- ✅ Workflow execution en Temporal UI
- ✅ Activity heartbeats (shipping progress)
- ✅ Signals funcionando (approve/reject/cancel)
- ✅ Queries retornando estado en tiempo real
- ✅ Retry automático en activities
- ✅ Saga compensations al fallar o cancelar
- ✅ Timeout de aprobación (2 min)
- ✅ Search attributes en Temporal UI
- ✅ Diferentes chaos scenarios
- ✅ Correlation IDs en logs

---

**¡Listo para producción!** 🚀

Si tienes problemas, revisa los logs con `docker-compose logs -f [servicio]`
