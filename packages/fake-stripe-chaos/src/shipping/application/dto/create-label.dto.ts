import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  state: string;

  @ApiProperty({ example: '94105' })
  @IsString()
  zip: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country: string;
}

export class CreateLabelDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'UPS', required: false })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({ example: 'ORD-12345', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class CreateLabelResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'lbl_abc123def456' })
  labelId: string;

  @ApiProperty({ example: '1ZAB123CD456789012' })
  trackingNumber: string;

  @ApiProperty({ example: 'UPS' })
  carrier: string;

  @ApiProperty({ example: 'generated' })
  status: string;

  @ApiProperty({ example: 'https://shipping.example.com/label/abc123.pdf' })
  labelUrl: string;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'ORD-12345', required: false })
  orderId?: string;
}
