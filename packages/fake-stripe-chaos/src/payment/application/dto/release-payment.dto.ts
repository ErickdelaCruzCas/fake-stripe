import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReleasePaymentDto {
  @ApiProperty({
    description: 'Authorization ID to release',
    example: 'auth_abc123def456',
  })
  @IsString()
  authId: string;
}

export class ReleasePaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'auth_abc123def456' })
  authId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: 'released' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:02:00.000Z' })
  releasedAt: Date;
}
