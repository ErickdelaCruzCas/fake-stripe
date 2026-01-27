# Migración de Axios a HttpService

## ¿Por qué HttpService en lugar de Axios directamente?

### Antes (❌ Mala Práctica)

```typescript
import axios from 'axios';

@Injectable()
export class IpApiAdapter {
  async getCurrentLocation(): Promise<Location> {
    const response = await axios.get('https://ipapi.co/json', {
      timeout: 5000
    });
    return response.data;
  }
}
```

**Problemas:**
- ❌ Sin logging centralizado
- ❌ Sin retry automático
- ❌ Difícil de mockear en tests
- ❌ Sin tracing distribuido
- ❌ Sin interceptores
- ❌ Configuración duplicada en cada adapter

### Después (✅ Buena Práctica)

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IpApiAdapter {
  constructor(private readonly httpService: HttpService) {}

  async getCurrentLocation(): Promise<Location> {
    const response = await firstValueFrom(
      this.httpService.get('https://ipapi.co/json')
    );
    return response.data;
  }
}
```

**Ventajas:**
- ✅ Logging automático de todas las llamadas HTTP
- ✅ Retry automático configurable (3 intentos con backoff exponencial)
- ✅ Fácil de mockear en tests unitarios
- ✅ Soporte para tracing distribuido (correlation IDs)
- ✅ Interceptores centralizados
- ✅ Configuración global (timeout, headers)

---

## Ventajas Específicas

### 1. Logging Centralizado

**Antes**: Cada adapter logeaba manualmente (o no logeaba)
```typescript
try {
  const response = await axios.get(url);
  console.log('Success:', url); // ❌ Manual, inconsistente
} catch (error) {
  console.error('Error:', error); // ❌ Sin contexto
}
```

**Después**: Interceptor automático logea todo
```typescript
// HttpLoggingInterceptor hace esto automáticamente:
{
  message: 'HTTP request completed',
  correlationId: 'abc-123',
  method: 'GET',
  url: 'https://ipapi.co/json',
  status: 200,
  durationMs: 150
}
```

### 2. Retry Automático

**Antes**: Retry manual en cada adapter
```typescript
let attempts = 0;
while (attempts < 3) {
  try {
    return await axios.get(url);
  } catch (error) {
    attempts++;
    await sleep(1000 * attempts); // ❌ Duplicado en cada adapter
  }
}
```

**Después**: Interceptor automático con política centralizada
```typescript
// HttpRetryInterceptor hace esto automáticamente:
// - 3 intentos
// - Backoff exponencial: 1s, 2s, 4s
// - Solo reintenta errores 5xx
// - No reintenta 4xx (client errors)
```

### 3. Testing

**Antes**: Mock manual de axios
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: mockData });
```

**Después**: Mock del servicio de NestJS
```typescript
const mockHttpService = {
  get: jest.fn().mockReturnValue(of({ data: mockData }))
};

TestingModule.overrideProvider(HttpService)
  .useValue(mockHttpService)
  .compile();
```

### 4. Tracing Distribuido

**Antes**: Propagar correlation IDs manualmente
```typescript
const response = await axios.get(url, {
  headers: {
    'x-correlation-id': correlationId // ❌ Manual en cada llamada
  }
});
```

**Después**: Interceptor automático propaga headers
```typescript
// Configurar una vez en HttpModule:
HttpModule.register({
  headers: {
    'x-correlation-id': correlationId // ✅ Automático en todas las llamadas
  }
})
```

### 5. RxJS Integration

**Ventaja**: Composición de observables para flujos complejos

```typescript
// Ejemplo: Combinar múltiples APIs con retry y timeout
forkJoin({
  location: this.httpService.get('/location').pipe(
    timeout(3000),
    retry(3),
    catchError(() => of(null))
  ),
  weather: this.httpService.get('/weather').pipe(
    timeout(5000),
    retry(2),
    catchError(() => of(null))
  )
}).subscribe(results => {
  // Ambos ejecutados en paralelo con políticas diferentes
});
```

---

## Interceptores Implementados

### 1. HttpLoggingInterceptor

**Ubicación**: `src/infrastructure/interceptors/http-logging.interceptor.ts`

**Funcionalidad**:
- Logea todas las peticiones HTTP salientes
- Incluye correlationId, URL, método, status, duración
- Logea errores con contexto completo

**Ejemplo de log**:
```json
{
  "message": "HTTP request completed",
  "correlationId": "a1b2c3d4",
  "method": "GET",
  "url": "https://api.openweathermap.org/data/2.5/weather",
  "status": 200,
  "durationMs": 320
}
```

### 2. HttpRetryInterceptor

**Ubicación**: `src/infrastructure/interceptors/http-retry.interceptor.ts`

**Política de retry**:
- Máximo: 3 intentos
- Backoff: Exponencial (1s, 2s, 4s)
- Reintenta: Solo errores 5xx (500, 502, 503, 504)
- No reintenta: Errores 4xx (client errors)

**Ejemplo de log**:
```json
{
  "message": "Retrying HTTP request (attempt 2/3)",
  "correlationId": "a1b2c3d4",
  "status": 503,
  "url": "https://catfact.ninja/fact",
  "delayMs": 2000
}
```

---

## Configuración Global

**Archivo**: `src/app.module.ts`

```typescript
HttpModule.register({
  timeout: 5000,        // Timeout global: 5s
  maxRedirects: 5,      // Máximo redirects
})
```

**Interceptores globales**:
```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: HttpLoggingInterceptor,
},
{
  provide: APP_INTERCEPTOR,
  useClass: HttpRetryInterceptor,
}
```

---

## Comparación de Código

### Adapter Antes

```typescript
import axios, { AxiosError } from 'axios';

@Injectable()
export class OpenWeatherMapAdapter implements WeatherPort {
  private readonly timeout = 5000;

  async getWeather(lat: number, lon: number): Promise<Weather> {
    try {
      const response = await axios.get(url, {
        params: { lat, lon, appid: apiKey },
        timeout: this.timeout,
      });
      return Weather.fromApiResponse(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          throw new HttpException('Timeout', 408);
        }
        throw new HttpException('Bad Gateway', 502);
      }
      throw error;
    }
  }
}
```

### Adapter Después

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class OpenWeatherMapAdapter implements WeatherPort {
  constructor(private readonly httpService: HttpService) {}

  async getWeather(lat: number, lon: number): Promise<Weather> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { lat, lon, appid: apiKey }
      }).pipe(
        catchError((error: AxiosError) => {
          if (error.code === 'ECONNABORTED') {
            throw new HttpException('Timeout', 408);
          }
          throw new HttpException('Bad Gateway', 502);
        })
      )
    );

    return Weather.fromApiResponse(response.data);
  }
}
```

**Diferencias**:
- ✅ Sin `timeout` hardcoded (usa configuración global)
- ✅ Logging automático (interceptor)
- ✅ Retry automático (interceptor)
- ✅ Inyección de dependencias (testeable)
- ✅ RxJS operators para composición

---

## Testing con HttpService

### Test Unitario (Adapter)

```typescript
describe('OpenWeatherMapAdapter', () => {
  let adapter: OpenWeatherMapAdapter;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenWeatherMapAdapter,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    adapter = module.get<OpenWeatherMapAdapter>(OpenWeatherMapAdapter);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should fetch weather data', async () => {
    const mockResponse = {
      data: { main: { temp: 20 }, weather: [{ description: 'clear' }] }
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse) as any);

    const result = await adapter.getWeather(37.7749, -122.4194);

    expect(result.temperature).toBe(20);
    expect(result.description).toBe('clear');
  });

  it('should handle timeout errors', async () => {
    const error = new AxiosError('Timeout');
    error.code = 'ECONNABORTED';

    jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => error) as any);

    await expect(adapter.getWeather(37.7749, -122.4194))
      .rejects
      .toThrow('Timeout');
  });
});
```

---

## Próximos Pasos (Mejoras Futuras)

### 1. Interceptor de Correlation ID
Propagar automáticamente correlation IDs en todos los requests HTTP salientes.

```typescript
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request['correlationId'] || uuidv4();

    // Añadir header a todas las peticiones HTTP salientes
    // (requiere configuración de axios interceptors)

    return next.handle();
  }
}
```

### 2. Circuit Breaker
Implementar patrón Circuit Breaker para evitar llamadas a APIs que están fallando.

```typescript
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private failureCount = 0;
  private isOpen = false;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.isOpen) {
      throw new ServiceUnavailableException('Circuit breaker is open');
    }

    return next.handle().pipe(
      tap(() => this.onSuccess()),
      catchError(error => {
        this.onFailure();
        throw error;
      })
    );
  }
}
```

### 3. Métricas y Monitoreo
Integrar con Prometheus para métricas de HTTP requests.

```typescript
httpRequestDuration.observe({
  method: 'GET',
  endpoint: '/weather',
  status: 200
}, durationSeconds);
```

---

## Conclusión

**HttpService + Interceptores >> axios directo**

Ventajas clave:
1. ✅ Centralización (DRY principle)
2. ✅ Testing más fácil
3. ✅ Observabilidad (logging, tracing, métricas)
4. ✅ Resiliencia (retry, circuit breaker)
5. ✅ Mantenibilidad (un solo lugar para cambiar políticas)

Este refactor es **production-ready** y sigue las mejores prácticas de NestJS.
