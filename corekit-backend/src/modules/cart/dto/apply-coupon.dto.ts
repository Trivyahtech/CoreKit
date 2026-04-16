import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  couponCode: string;
}
