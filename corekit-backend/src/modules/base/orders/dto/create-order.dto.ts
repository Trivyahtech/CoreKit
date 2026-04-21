import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'address_id_here', description: 'Billing address ID' })
  @IsString()
  billingAddressId: string;

  @ApiProperty({ example: 'address_id_here', description: 'Shipping address ID' })
  @IsString()
  shippingAddressId: string;

  @ApiPropertyOptional({ description: 'Shipping rule ID chosen from /shipping/quote' })
  @IsOptional()
  @IsString()
  shippingRuleId?: string;

  @ApiPropertyOptional({ example: 500, description: 'Total parcel weight in grams' })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Please gift wrap this' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}
