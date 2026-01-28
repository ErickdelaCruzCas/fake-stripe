import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReleaseInventoryDto {
  @ApiProperty({ example: 'res_abc123def456' })
  @IsString()
  reservationId: string;
}

export class ReleaseInventoryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'res_abc123def456' })
  reservationId: string;

  @ApiProperty({ example: 'released' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:05:00.000Z' })
  releasedAt: Date;
}
