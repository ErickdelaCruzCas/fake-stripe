import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CapturePaymentDto {
  @ApiProperty({
    description: 'Authorization ID to capture',
    example: 'auth_abc123def456',
  })
  @IsString()
  authId: string;
}

export class CapturePaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'auth_abc123def456' })
  authId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: 'captured' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:01:00.000Z' })
  capturedAt: Date;
}
