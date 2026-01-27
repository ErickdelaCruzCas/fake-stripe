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
    .setTitle('Temporal API')
    .setDescription(
      'REST API for Temporal workflow orchestration - start workflows, query status, track progress'
    )
    .setVersion('1.0')
    .addTag('workflows', 'Workflow execution and management')
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
