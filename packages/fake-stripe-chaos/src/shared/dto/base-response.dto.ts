import { ApiProperty } from '@nestjs/swagger';

export class BaseSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  timestamp: Date;
}

export class BaseErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'insufficient_funds' })
  error: string;

  @ApiProperty({ example: 'The card has insufficient funds to complete this transaction' })
  message: string;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  timestamp?: Date;
}
