import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'product_id_here' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'variant_id_here' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
