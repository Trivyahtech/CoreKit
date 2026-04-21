import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'CONFIRMED', enum: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Payment verified, order confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class RefundOrderDto {
  @ApiPropertyOptional({ example: 'Customer requested full refund' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Found the wrong size' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
