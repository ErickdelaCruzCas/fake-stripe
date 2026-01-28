import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsEmail, IsBoolean, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'ITEM-001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  price: number;
}

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

export class CreateOrderDto {
  @ApiProperty({ example: 'ORD-12345' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'CUST-67890' })
  @IsString()
  customerId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 109.97, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    example: false,
    description: 'If true, workflow waits for manager approval',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class CreateOrderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'order-fulfillment-ORD-12345' })
  workflowId: string;

  @ApiProperty({ example: 'order-fulfillment-ORD-12345' })
  runId: string;

  @ApiProperty({ example: 'ORD-12345' })
  orderId: string;

  @ApiProperty({
    example: 'pending_approval',
    enum: ['pending_approval', 'processing', 'shipped', 'failed', 'cancelled'],
  })
  status: string;
}
