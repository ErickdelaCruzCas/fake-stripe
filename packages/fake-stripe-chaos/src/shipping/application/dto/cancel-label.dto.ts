import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelLabelDto {
  @ApiProperty({ example: 'lbl_abc123def456' })
  @IsString()
  labelId: string;
}

export class CancelLabelResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'lbl_abc123def456' })
  labelId: string;

  @ApiProperty({ example: 'cancelled' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:05:00.000Z' })
  cancelledAt: Date;
}
