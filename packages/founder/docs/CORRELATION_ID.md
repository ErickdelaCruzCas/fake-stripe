# Correlation ID Middleware

## ¿Qué es un Correlation ID?

Un **Correlation ID** es un identificador único (UUID) que se asigna a cada request HTTP y se propaga a través de todos los servicios y componentes que participan en el procesamiento de ese request.

Es esencial para:
- **Trazabilidad distribuida**: Seguir un request a través de múltiples microservicios
- **Debugging**: Buscar todos los logs relacionados con un request específico
- **Monitoreo**: Identificar requests lentos o con errores
- **Auditoría**: Rastrear quién hizo qué y cuándo

## Implementación

### Middleware: CorrelationIdMiddleware

**Ubicación**: `src/infrastructure/middleware/correlation-id.middleware.ts`

**Funcionalidad**:
1. Lee el header `x-correlation-id` del request (si el cliente lo envía)
2. Genera un nuevo UUID v4 si no existe
3. Añade el correlation ID al request para acceso en toda la aplicación
4. Añade el correlation ID al response header
5. Logea el request inicial con correlation ID

**Header HTTP**:
```
x-correlation-id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Middleware: RequestLoggerMiddleware

**Ubicación**: `src/infrastructure/middleware/request-logger.middleware.ts`

**Funcionalidad**:
- Logea el inicio y fin de cada request
- Incluye correlation ID en los logs
- Mide duración del request en ms
- Ajusta nivel de log según status code (error/warn/log)

**IMPORTANTE**: Este middleware debe ejecutarse DESPUÉS de CorrelationIdMiddleware para tener acceso al correlation ID.

## Configuración en AppModule

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ORDEN IMPORTANTE:
    // 1. CorrelationIdMiddleware - genera/extrae el ID
    // 2. RequestLoggerMiddleware - usa el ID para logging
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*'); // Aplica a todas las rutas
  }
}
```

## Propagación a Servicios Externos

Los adapters propagan el correlation ID a las APIs externas mediante headers HTTP:

```typescript
// Ejemplo en IpApiAdapter
this.httpService.get(`${this.baseUrl}/json`, {
  headers: {
    'User-Agent': 'Fake-Stripe-Founder/1.0',
    [CORRELATION_ID_HEADER]: correlationId, // Propagar correlation ID
  },
})
```

Esto permite:
- Las APIs externas pueden logearlo en sus sistemas
- Trazabilidad end-to-end a través de múltiples servicios
- Compatible con estándares de distributed tracing (OpenTelemetry, Jaeger, Zipkin)

## Uso en Componentes

### En Controllers

```typescript
@Get('user-context')
async getUserContext(@Req() req: Request): Promise<UserContextResponseDto> {
  const correlationId = req.correlationId; // Acceso al correlation ID

  // Pasar a services/adapters
  return this.userContextService.aggregate(correlationId);
}
```

### En Services

```typescript
async aggregate(correlationId: string): Promise<UserContext> {
  // Pasar a adapters
  const location = await this.locationPort.getCurrentLocation(correlationId);
  const weather = await this.weatherPort.getWeather(lat, lon, correlationId);
  // ...
}
```

### En Adapters

```typescript
async getCurrentLocation(correlationId: string): Promise<Location> {
  const response = await firstValueFrom(
    this.httpService.get(url, {
      headers: {
        [CORRELATION_ID_HEADER]: correlationId, // Propagar a API externa
      },
    })
  );
  // ...
}
```

## Formato de Logs

### Log de Request Inicial (CorrelationIdMiddleware)

```json
{
  "message": "Incoming request",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "GET",
  "url": "/api/v1/user-context",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
```

### Log de Request Completado (RequestLoggerMiddleware)

```json
{
  "message": "Request completed",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "GET",
  "url": "/api/v1/user-context",
  "statusCode": 200,
  "durationMs": 450
}
```

### Log de HTTP Request a API Externa (HttpLoggingInterceptor)

```json
{
  "message": "HTTP request completed",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "GET",
  "url": "https://api.openweathermap.org/data/2.5/weather",
  "status": 200,
  "durationMs": 320
}
```

### Log de Retry (HttpRetryInterceptor)

```json
{
  "message": "Retrying HTTP request (attempt 2/3)",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": 503,
  "url": "https://catfact.ninja/fact",
  "delayMs": 2000
}
```

## Búsqueda de Logs por Correlation ID

### En desarrollo (console)

```bash
# Ver todos los logs de un request específico
npm run dev 2>&1 | grep "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### En producción (con Grafana Loki/Elasticsearch)

```logql
# Query en Grafana Loki
{job="founder-service"} |= "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Query en Elasticsearch
{
  "query": {
    "match": {
      "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  }
}
```

## Testing con Correlation ID

### Enviar desde Cliente

```bash
# cURL con correlation ID personalizado
curl -H "x-correlation-id: my-custom-id-123" \
  http://localhost:3000/api/v1/user-context
```

### REST Client (requests.http)

```http
GET http://localhost:3000/api/v1/user-context
x-correlation-id: test-correlation-id-456
```

### Verificar en Response

```bash
# El response header incluye el correlation ID
curl -v http://localhost:3000/api/v1/user-context

# Output:
# < x-correlation-id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Flujo Completo de un Request

```
1. Cliente envía request (con o sin correlation ID)
   ↓
2. CorrelationIdMiddleware
   - Extrae o genera correlation ID
   - Lo añade al request
   - Lo añade al response header
   - Logea: "Incoming request"
   ↓
3. RequestLoggerMiddleware
   - Captura inicio del request
   - Espera a que termine
   ↓
4. Controller procesa request
   - Accede al correlationId desde request
   - Lo pasa a services
   ↓
5. Service llama a adapters
   - Pasa correlationId a cada adapter
   ↓
6. Adapters llaman a APIs externas
   - HttpLoggingInterceptor logea: "HTTP request started"
   - Propagan correlation ID en headers
   - HttpRetryInterceptor reintenta si falla (logeando cada intento)
   - HttpLoggingInterceptor logea: "HTTP request completed"
   ↓
7. Controller retorna respuesta
   ↓
8. RequestLoggerMiddleware logea: "Request completed"
   - Incluye statusCode y durationMs
   ↓
9. Cliente recibe respuesta con correlation ID en header
```

## Ejemplo de Logs de un Request Completo

```json
// 1. Request inicial
{
  "message": "Incoming request",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/v1/user-context"
}

// 2. HTTP call a IPApi
{
  "message": "HTTP request completed",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "https://ipapi.co/json",
  "status": 200,
  "durationMs": 150
}

// 3. HTTP call a OpenWeatherMap
{
  "message": "HTTP request completed",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "https://api.openweathermap.org/data/2.5/weather",
  "status": 200,
  "durationMs": 320
}

// 4. HTTP call a CatFact (con retry)
{
  "message": "HTTP request failed",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "https://catfact.ninja/fact",
  "status": 503,
  "durationMs": 100
}

{
  "message": "Retrying HTTP request (attempt 1/3)",
  "correlationId": "abc-123",
  "status": 503,
  "url": "https://catfact.ninja/fact",
  "delayMs": 1000
}

{
  "message": "HTTP request completed",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "https://catfact.ninja/fact",
  "status": 200,
  "durationMs": 80
}

// 5. Request completado
{
  "message": "Request completed",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/v1/user-context",
  "statusCode": 200,
  "durationMs": 650
}
```

**Ventaja**: Todos estos logs tienen el mismo `correlationId`, así que puedes buscar por `abc-123` y ver el flujo completo del request.

## TypeScript Types

### Extended Request Type

**Ubicación**: `src/types/express.d.ts`

```typescript
declare namespace Express {
  export interface Request {
    correlationId?: string;
  }
}
```

Este archivo extiende el tipo `Request` de Express para incluir la propiedad `correlationId`. TypeScript lo reconoce automáticamente.

## Beneficios

### 1. Debugging Rápido

**Problema**: Un usuario reporta un error en producción.

**Solución**:
1. Usuario proporciona su correlation ID del response header
2. Buscas en logs por ese correlation ID
3. Ves TODOS los logs relacionados con ese request específico
4. Identificas exactamente qué API falló y por qué

### 2. Performance Monitoring

**Problema**: Algunos requests son lentos.

**Solución**:
1. Filtras logs por `durationMs > 1000`
2. Agrupas por correlation ID
3. Ves qué APIs están tardando más
4. Optimizas las lentas

### 3. Distributed Tracing

**Problema**: Request pasa por múltiples microservicios (Founder → Fake Stripe → Payment Gateway).

**Solución**:
1. Correlation ID se propaga a través de todos los servicios
2. Cada servicio logea con el mismo correlation ID
3. Herramientas como Jaeger/Zipkin visualizan el flujo completo
4. Ves tiempos de cada servicio en un timeline

### 4. Auditoría y Compliance

**Problema**: Necesitas demostrar qué procesamiento se hizo para datos de un usuario.

**Solución**:
1. Cada request tiene correlation ID único
2. Logs inmutables con timestamps
3. Puedes demostrar exactamente qué datos se accedieron y cuándo
4. Cumplimiento con GDPR, SOC2, etc.

## Integración con Herramientas

### OpenTelemetry (Future)

```typescript
// Crear span con correlation ID
const span = tracer.startSpan('user-context-aggregation', {
  attributes: {
    'correlation.id': correlationId,
    'http.method': 'GET',
    'http.url': '/api/v1/user-context',
  },
});
```

### Grafana Loki (Future)

```yaml
# promtail-config.yml
scrape_configs:
  - job_name: founder-service
    static_configs:
      - targets:
          - localhost
        labels:
          job: founder-service
    pipeline_stages:
      - json:
          expressions:
            correlationId: correlationId
            message: message
            level: level
      - labels:
          correlationId:
```

### Jaeger (Future)

Correlation ID se mapea a `trace_id` en Jaeger para distributed tracing visual.

## Best Practices

### ✅ DO

- Generar correlation ID en el punto de entrada (API Gateway, Load Balancer, o primer servicio)
- Propagar correlation ID a TODAS las llamadas downstream (bases de datos, APIs, message queues)
- Incluir correlation ID en TODOS los logs estructurados
- Retornar correlation ID en response headers
- Usar UUIDs v4 (son únicos globalmente)

### ❌ DON'T

- Usar correlation IDs secuenciales (información sensible)
- Logar correlation ID solo en algunos lugares (rompe la trazabilidad)
- Modificar el correlation ID en medio del request
- Olvidar propagar el correlation ID a servicios externos

## Referencias

- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry Correlation Context](https://opentelemetry.io/docs/concepts/context-propagation/)
- [Google Cloud Trace Context](https://cloud.google.com/trace/docs/setup#force-trace)
- [AWS X-Ray Trace ID](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-tracingheader)
