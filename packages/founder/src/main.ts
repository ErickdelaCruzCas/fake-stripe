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
    .setTitle('Fake Stripe - Founder API')
    .setDescription(
      'User context aggregator service combining location, weather, and entertainment data using hexagonal architecture with multiple concurrency strategies'
    )
    .setVersion('1.0')
    .addTag('user-context', 'User context aggregation endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Fake Stripe - Founder Service Started');
  console.log('='.repeat(60));
  console.log(`📡 API Server:    http://localhost:${port}`);
  console.log(`📚 Swagger UI:    http://localhost:${port}/api/docs`);
  console.log('='.repeat(60));
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    http://localhost:${port}/api/v1/user-context?strategy=<name>`);
  console.log(`  GET    http://localhost:${port}/health`);
  console.log('');
  console.log('Concurrency strategies:');
  console.log('  - promise-allsettled (default)');
  console.log('  - rxjs');
  console.log('  - async-sequential');
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Ready to accept requests');
  console.log('');
}

bootstrap();
