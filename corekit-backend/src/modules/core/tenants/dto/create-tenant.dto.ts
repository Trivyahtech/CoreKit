import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Corekit Demo' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'corekit' })
  @IsString()
  @Matches(/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (3-64 chars)',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'IN' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  defaultCountry?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  @MaxLength(254)
  adminEmail: string;

  @ApiProperty({ example: 'Strong#Pass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  adminPassword: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @Length(1, 80)
  adminFirstName: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  adminLastName?: string;
}
