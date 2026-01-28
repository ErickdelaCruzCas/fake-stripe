import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Enable CORS
  app.enableCors();

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Temporal API - Workflow Orchestration')
    .setDescription(
      'REST API for Temporal workflow orchestration.\n\n' +
      '**Phase 3:** User Context workflows (location, weather, cat fact)\n' +
      '**Phase 4:** Order Fulfillment workflows (payment, inventory, shipping, notification)\n\n' +
      'Features: Signals, Queries, Search Attributes, Saga Pattern, Activity Heartbeats, Timeouts'
    )
    .setVersion('2.0')
    .addTag('workflows', 'User Context workflows (Phase 3)')
    .addTag('order-fulfillment', 'Order Fulfillment workflows with Saga pattern (Phase 4)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'temporal-api',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log('\n🚀 Temporal API started successfully');
  console.log(`📡 Listening on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health check: http://localhost:${port}/health\n`);
}

bootstrap();
