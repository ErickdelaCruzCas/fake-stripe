import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class StartUserContextWorkflowDto {
  @ApiProperty({
    description: 'Execution strategy for API aggregation',
    enum: ['parallel', 'sequential'],
    default: 'parallel',
    example: 'parallel',
  })
  @IsEnum(['parallel', 'sequential'])
  @IsOptional()
  strategy?: 'parallel' | 'sequential';

  @ApiProperty({
    description: 'Correlation ID for distributed tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  correlationId?: string;
}

export class StartPaymentWorkflowDto {
  @ApiProperty({
    description: 'Payment amount in cents',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'usd',
    default: 'usd',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    description: 'Payment source token',
    example: 'tok_visa',
  })
  @IsString()
  @IsNotEmpty()
  source!: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Test payment',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Correlation ID for distributed tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  correlationId?: string;
}
