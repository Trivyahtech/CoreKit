import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum PaymentProviderEnum {
  RAZORPAY = 'RAZORPAY',
  COD = 'COD',
  MANUAL = 'MANUAL',
}

export enum PaymentMethodEnum {
  UPI = 'UPI',
  CARD = 'CARD',
  NETBANKING = 'NETBANKING',
  WALLET = 'WALLET',
  COD = 'COD',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'order_id_here' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'RAZORPAY', enum: PaymentProviderEnum })
  @IsEnum(PaymentProviderEnum)
  provider: PaymentProviderEnum;

  @ApiPropertyOptional({ example: 'UPI', enum: PaymentMethodEnum })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  method?: PaymentMethodEnum;
}
