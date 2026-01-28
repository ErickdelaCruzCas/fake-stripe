import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  @ApiProperty({ example: 'ITEM-001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'WH-US-EAST', required: false })
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class ReserveInventoryDto {
  @ApiProperty({ type: [InventoryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  items: InventoryItemDto[];

  @ApiProperty({ example: 'ORD-12345', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class ReserveInventoryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'res_abc123def456' })
  reservationId: string;

  @ApiProperty({ type: [InventoryItemDto] })
  items: InventoryItemDto[];

  @ApiProperty({ example: 'reserved' })
  status: string;

  @ApiProperty({ example: '2026-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-28T10:30:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: 'ORD-12345', required: false })
  orderId?: string;
}
