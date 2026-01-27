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
    .setTitle('Fake Stripe - Chaos Payment Service')
    .setDescription(
      'Payment processing service with chaos engineering for testing resilience. ' +
      'Simulates random failures (timeouts, server errors, insufficient funds) ' +
      'with configurable probability distribution.'
    )
    .setVersion('1.0')
    .addTag('payment', 'Payment processing endpoints with chaos')
    .addTag('stats', 'Statistics and monitoring endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('='.repeat(60));
  console.log('💥 Fake Stripe - Chaos Payment Service Started');
  console.log('='.repeat(60));
  console.log(`📡 API Server:    http://localhost:${port}`);
  console.log(`📚 Swagger UI:    http://localhost:${port}/api/docs`);
  console.log('='.repeat(60));
  console.log('');
  console.log('Chaos Engineering Configuration:');
  console.log('  - 40% Success    (HTTP 200)');
  console.log('  - 30% Timeout    (HTTP 408) - 5s delay');
  console.log('  - 20% Error 500  (Internal Server Error)');
  console.log('  - 10% Error 402  (Insufficient Funds)');
  console.log('='.repeat(60));
  console.log('');
  console.log('Available endpoints:');
  console.log(`  POST   http://localhost:${port}/payment/charge`);
  console.log(`  GET    http://localhost:${port}/payment/stats`);
  console.log(`  GET    http://localhost:${port}/payment/stats/recent`);
  console.log(`  POST   http://localhost:${port}/payment/stats/reset`);
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Ready to simulate chaos');
  console.log('');
}

bootstrap();
