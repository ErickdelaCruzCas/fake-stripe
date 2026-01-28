import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ enum: ['email', 'sms', 'push'], example: 'email' })
  @IsEnum(['email', 'sms', 'push'])
  type: 'email' | 'sms' | 'push';

  @ApiProperty({ example: 'customer@example.com' })
  @IsString()
  recipient: string;

  @ApiProperty({ example: 'Your order has shipped!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Your order ORD-12345 has been shipped and will arrive in 3-5 business days.' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'ORD-12345', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class SendNotificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'ntf_abc123def456' })
  notificationId: string;

  @ApiProperty({ example: 'email' })
  type: string;

  @ApiProperty({ example: 'customer@example.com' })
  recipient: string;

  @ApiProperty({ example: 'sent' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  sentAt: Date;

  @ApiProperty({ example: 'ORD-12345', required: false })
  orderId?: string;
}
