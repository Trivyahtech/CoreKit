import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignCategoriesDto {
  @ApiProperty({ example: ['cat_id_1', 'cat_id_2'] })
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];
}
