import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ example: 'clx_product_id' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Loved it!' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: 'Fit is spot on, fabric is thick.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ReviewStatus, example: 'APPROVED' })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ example: 'Contains profanity' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  moderationNote?: string;
}
