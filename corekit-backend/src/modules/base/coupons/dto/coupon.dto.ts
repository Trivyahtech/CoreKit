import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'CADET30' })
  @IsString()
  @Length(3, 64)
  code: string;

  @ApiProperty({ enum: CouponType, example: 'PERCENTAGE' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ example: 30, description: '% when PERCENTAGE, flat ₹ when FLAT' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minCartValue?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
