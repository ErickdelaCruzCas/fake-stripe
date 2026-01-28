import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AuthorizePaymentDto {
  @ApiProperty({
    description: 'Amount to authorize (in cents)',
    example: 10000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    enum: ['usd', 'eur', 'gbp', 'mxn'],
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Order ID',
    example: 'ORD-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    description: 'Customer ID',
    example: 'CUST-67890',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class AuthorizePaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'auth_abc123def456' })
  authId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: 'authorized' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-04T10:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: 'ORD-12345', required: false })
  orderId?: string;

  @ApiProperty({ example: 'CUST-67890', required: false })
  customerId?: string;
}
