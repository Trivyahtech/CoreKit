import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum AddressTypeEnum {
  SHIPPING = 'SHIPPING',
  BILLING = 'BILLING',
}

export class CreateAddressDto {
  @ApiProperty({ example: 'SHIPPING', enum: AddressTypeEnum })
  @IsOptional()
  @IsEnum(AddressTypeEnum)
  type?: AddressTypeEnum;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 MG Road' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Near City Mall' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional({ example: 'Opposite Park' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  pincode: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
