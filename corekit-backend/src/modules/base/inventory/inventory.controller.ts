import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StockChangeReason, UserRole } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { InventoryService } from './inventory.service.js';

class AdjustStockDto {
  @IsString() variantId: string;
  @IsInt() change: number;
  @IsEnum(StockChangeReason) reason: StockChangeReason;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('summary')
  @ApiOperation({ summary: 'Inventory snapshot (low stock + totals)' })
  summary(@Request() req: any) {
    return this.inventory.summary(req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('lots')
  @ApiOperation({ summary: 'List inventory lots' })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'onlyRemaining', required: false })
  listLots(
    @Request() req: any,
    @Query('variantId') variantId?: string,
    @Query('onlyRemaining') onlyRemaining?: string,
  ) {
    return this.inventory.listLots(req.user.tenantId, {
      variantId,
      onlyRemaining: onlyRemaining === 'true' || onlyRemaining === '1',
    });
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('ledger')
  @ApiOperation({ summary: 'Stock change audit ledger' })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  listLedger(
    @Request() req: any,
    @Query('variantId') variantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventory.listLedger(req.user.tenantId, {
      variantId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post('adjust')
  @ApiOperation({
    summary: 'Manual stock adjustment (writes audit + bumps stockOnHand)',
  })
  adjust(@Request() req: any, @Body() dto: AdjustStockDto) {
    if (!Number.isInteger(dto.change) || dto.change === 0) {
      throw new BadRequestException('change must be a non-zero integer');
    }
    return this.inventory.adjust({
      tenantId: req.user.tenantId,
      variantId: dto.variantId,
      change: dto.change,
      reason: dto.reason,
      note: dto.note,
      actorUserId: req.user.id,
    });
  }
}
