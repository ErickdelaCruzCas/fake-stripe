import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for successful charge response
 */
export class ChargeResponseDto {
  @ApiProperty({
    description: 'Whether the charge was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Unique charge ID',
    example: 'ch_1234567890abcdef',
  })
  chargeId!: string;

  @ApiProperty({
    description: 'Amount charged in cents',
    example: 1000,
  })
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
  })
  currency!: string;

  @ApiProperty({
    description: 'Charge status',
    example: 'succeeded',
  })
  status!: string;

  @ApiProperty({
    description: 'Timestamp when charge was created',
    example: '2024-01-26T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Description of the charge',
    example: 'Premium user context subscription',
    required: false,
  })
  description?: string;
}

/**
 * DTO for charge error response
 */
export class ChargeErrorResponseDto {
  @ApiProperty({
    description: 'Whether the charge was successful',
    example: false,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Error code',
    example: 'insufficient_funds',
  })
  error!: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'The card has insufficient funds',
  })
  message!: string;
}
