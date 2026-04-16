import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'address_id_here', description: 'Billing address ID' })
  @IsString()
  billingAddressId: string;

  @ApiProperty({ example: 'address_id_here', description: 'Shipping address ID' })
  @IsString()
  shippingAddressId: string;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Please gift wrap this' })
  @IsOptional()
  @IsString()
  customerNote?: string;
}
