import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Fake Stripe - Order Fulfillment Chaos Service')
    .setDescription(
      'Complete order fulfillment service with chaos engineering for testing resilience. ' +
      'Simulates 4 bounded contexts: Payment, Inventory, Shipping, Notification. ' +
      'Each domain has specific failure scenarios for comprehensive testing.'
    )
    .setVersion('2.0')
    .addTag('payment', 'Payment authorization/capture/refund with chaos')
    .addTag('inventory', 'Inventory reservation with chaos')
    .addTag('shipping', 'Shipping label generation (long-running) with chaos')
    .addTag('notification', 'Customer notifications (non-critical) with chaos')
    .addTag('stats', 'Statistics and monitoring endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('='.repeat(70));
  console.log('💥 Fake Stripe - Order Fulfillment Chaos Service v2.0');
  console.log('='.repeat(70));
  console.log(`📡 API Server:    http://localhost:${port}`);
  console.log(`📚 Swagger UI:    http://localhost:${port}/api/docs`);
  console.log('='.repeat(70));
  console.log('');
  console.log('🏗️  Architecture: Vertical Slices + Hexagonal (per domain)');
  console.log('');
  console.log('📦 Payment Domain (authorize → capture → refund):');
  console.log(`  POST   http://localhost:${port}/payment/authorize`);
  console.log(`  POST   http://localhost:${port}/payment/capture`);
  console.log(`  POST   http://localhost:${port}/payment/release`);
  console.log(`  POST   http://localhost:${port}/payment/refund`);
  console.log('');
  console.log('📦 Inventory Domain (reserve → release):');
  console.log(`  POST   http://localhost:${port}/inventory/reserve`);
  console.log(`  POST   http://localhost:${port}/inventory/release`);
  console.log('');
  console.log('📦 Shipping Domain (create-label with heartbeat):');
  console.log(`  POST   http://localhost:${port}/shipping/create-label`);
  console.log(`  POST   http://localhost:${port}/shipping/cancel`);
  console.log('');
  console.log('📦 Notification Domain (send - non-critical):');
  console.log(`  POST   http://localhost:${port}/notification/send`);
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Ready for Temporal Order Fulfillment Workflow with Saga Pattern');
  console.log('='.repeat(70));
  console.log('');
}

bootstrap();
