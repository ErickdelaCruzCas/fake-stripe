import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PaymentController } from './payment/payment.controller';
import { StatsController } from './stats/stats.controller';
import { PaymentService } from './payment/payment.service';
import { ChaosEngineService } from './chaos/chaos-engine.service';
import { StatsService } from './stats/stats.service';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [],
  controllers: [PaymentController, StatsController],
  providers: [PaymentService, ChaosEngineService, StatsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
