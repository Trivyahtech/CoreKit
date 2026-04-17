import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'pay_XXXXXXXX' })
  @IsString()
  gatewayPaymentId: string;

  @ApiPropertyOptional({ example: 'sig_XXXXXXXX' })
  @IsOptional()
  @IsString()
  gatewaySignature?: string;
}
