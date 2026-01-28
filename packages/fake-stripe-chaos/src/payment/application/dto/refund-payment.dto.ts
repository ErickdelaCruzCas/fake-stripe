import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Authorization ID to refund',
    example: 'auth_abc123def456',
  })
  @IsString()
  authId: string;

  @ApiProperty({
    description: 'Amount to refund (in cents). If not provided, refunds the full amount',
    example: 5000,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer requested cancellation',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefundPaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 're_xyz789abc123' })
  refundId: string;

  @ApiProperty({ example: 'auth_abc123def456' })
  authId: string;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: 'succeeded' })
  status: string;

  @ApiProperty({ example: 'Customer requested cancellation' })
  reason: string;

  @ApiProperty({ example: '2026-01-28T10:03:00.000Z' })
  createdAt: Date;
}
