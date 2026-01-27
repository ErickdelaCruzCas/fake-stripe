import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

async function exportOpenApiSpec() {
  console.log('🚀 Starting OpenAPI spec export...\n');

  // Create app without listening (bootstrap only)
  const app = await NestFactory.create(AppModule, { logger: false });

  // Swagger configuration (same as main.ts)
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

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Export as JSON
  const jsonPath = path.join(outputDir, 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
  console.log(`✅ Exported: ${jsonPath}`);

  // Export as YAML
  const yamlPath = path.join(outputDir, 'openapi.yml');
  fs.writeFileSync(yamlPath, yaml.dump(document, { indent: 2, lineWidth: -1 }));
  console.log(`✅ Exported: ${yamlPath}`);

  console.log('\n📦 OpenAPI spec successfully exported!');
  console.log('\nNext steps:');
  console.log('  1. Review the generated files');
  console.log('  2. Commit them to Git: git add openapi.json openapi.yml');
  console.log('  3. Generate client: npm run openapi:generate-client\n');

  await app.close();
  process.exit(0);
}

exportOpenApiSpec().catch((error) => {
  console.error('❌ Error exporting OpenAPI spec:', error);
  process.exit(1);
});
