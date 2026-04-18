import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'CONFIRMED', enum: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Payment verified, order confirmed' })
  @IsOptional()
  @IsString()
  note?: string;
}
