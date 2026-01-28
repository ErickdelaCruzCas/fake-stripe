import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

// Nuevos módulos con arquitectura hexagonal
import { PaymentModule } from './payment/payment.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShippingModule } from './shipping/shipping.module';
import { NotificationModule } from './notification/notification.module';

// Stats service (mantener para backwards compatibility con endpoints antiguos)
import { StatsController } from './stats/stats.controller';
import { StatsService } from './stats/stats.service';

/**
 * App Module
 *
 * Módulo raíz con arquitectura vertical + hexagonal:
 * - Cada dominio (Payment, Inventory, Shipping, Notification) es un módulo independiente
 * - Cada dominio tiene su propia arquitectura hexagonal interna
 * - Bounded contexts claramente separados
 * - Correlation ID middleware aplicado globalmente
 */
@Module({
  imports: [
    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar correlation ID middleware a todas las rutas
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
