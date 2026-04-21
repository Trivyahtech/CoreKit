import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: 'corekit' })
  @IsString()
  @MaxLength(64)
  tenantSlug: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class VerifyOtpDto extends SendOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'corekit' })
  @IsString()
  @MaxLength(64)
  tenantSlug: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @Length(32, 128)
  token: string;

  @ApiProperty({ example: 'Strong#Pass1' })
  @IsString()
  @Length(8, 128)
  newPassword: string;
}
