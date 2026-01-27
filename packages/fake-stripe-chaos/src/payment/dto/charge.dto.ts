import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

/**
 * DTO for creating a payment charge
 */
export class ChargeDto {
  @ApiProperty({
    description: 'Amount to charge in cents (e.g., 1000 = $10.00)',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'usd',
  })
  @IsString()
  currency!: string;

  @ApiProperty({
    description: 'Payment source token (e.g., tok_visa, tok_mastercard)',
    example: 'tok_visa',
  })
  @IsString()
  source!: string;

  @ApiProperty({
    description: 'Description of the charge',
    example: 'Premium user context subscription',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
