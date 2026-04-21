import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ShippingMethod, ShippingZoneType } from '@prisma/client';

export class CreateShippingZoneDto {
  @ApiProperty({ example: 'North India' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiPropertyOptional({ enum: ShippingZoneType, default: ShippingZoneType.PINCODE })
  @IsOptional()
  @IsEnum(ShippingZoneType)
  type?: ShippingZoneType;

  @ApiProperty({ example: ['110001', '110002'], description: 'List of pincodes in this zone' })
  @IsArray()
  @IsString({ each: true })
  pincodes: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateShippingRuleDto {
  @ApiProperty({ example: 'Standard Ground' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ enum: ShippingMethod, example: ShippingMethod.STANDARD })
  @IsEnum(ShippingMethod)
  method: ShippingMethod;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minWeightGrams?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxWeightGrams?: number;

  @ApiPropertyOptional({ example: 49.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flatRate?: number;

  @ApiPropertyOptional({ example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerKg?: number;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isCodAllowed?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QuoteShippingDto {
  @ApiProperty({ example: '110001' })
  @IsString()
  @Length(3, 16)
  pincode: string;

  @ApiPropertyOptional({ example: 500, description: 'Total parcel weight in grams' })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional({ example: 1299.0, description: 'Order value before shipping' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderValue?: number;
}
