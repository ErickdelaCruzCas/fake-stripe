import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserContextController } from './presentation/controllers/user-context.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { UserContextService } from './domain/services/user-context.service';
import { IpApiAdapter } from './infrastructure/adapters/ipapi.adapter';
import { OpenWeatherMapAdapter } from './infrastructure/adapters/openweathermap.adapter';
import { CatFactAdapter } from './infrastructure/adapters/catfact.adapter';
import { PromiseAllSettledStrategy } from './infrastructure/strategies/promise-allsettled.strategy';
import { RxJSStrategy } from './infrastructure/strategies/rxjs.strategy';
import { AsyncSequentialStrategy } from './infrastructure/strategies/async-sequential.strategy';
import { HttpLoggingInterceptor } from './infrastructure/interceptors/http-logging.interceptor';
import { HttpRetryInterceptor } from './infrastructure/interceptors/http-retry.interceptor';
import { CorrelationIdMiddleware } from './infrastructure/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './infrastructure/middleware/request-logger.middleware';
import { LOCATION_PORT } from './domain/ports/location.port';
import { WEATHER_PORT } from './domain/ports/weather.port';
import { CAT_FACT_PORT } from './domain/ports/cat-fact.port';
import { AGGREGATION_STRATEGY } from './domain/ports/aggregation-strategy.port';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [UserContextController, HealthController],
  providers: [
    UserContextService,
    // Strategies
    PromiseAllSettledStrategy,
    RxJSStrategy,
    AsyncSequentialStrategy,
    // Adapters as Port implementations
    {
      provide: LOCATION_PORT,
      useClass: IpApiAdapter,
    },
    {
      provide: WEATHER_PORT,
      useClass: OpenWeatherMapAdapter,
    },
    {
      provide: CAT_FACT_PORT,
      useClass: CatFactAdapter,
    },
    // Dynamic strategy provider based on ENV
    {
      provide: AGGREGATION_STRATEGY,
      useFactory: (
        promiseStrategy: PromiseAllSettledStrategy,
        rxjsStrategy: RxJSStrategy,
        sequentialStrategy: AsyncSequentialStrategy,
        configService: ConfigService
      ) => {
        const strategy = configService.get<string>(
          'AGGREGATION_STRATEGY',
          'promise-allsettled'
        );

        switch (strategy) {
          case 'rxjs':
            return rxjsStrategy;
          case 'async-sequential':
            return sequentialStrategy;
          case 'promise-allsettled':
          default:
            return promiseStrategy;
        }
      },
      inject: [
        PromiseAllSettledStrategy,
        RxJSStrategy,
        AsyncSequentialStrategy,
        ConfigService,
      ],
    },
    // Global HTTP interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRetryInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middlewares se ejecutan en orden:
    // 1. CorrelationIdMiddleware - genera/extrae correlation ID
    // 2. RequestLoggerMiddleware - logea request con correlation ID
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
