import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto.js';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  @ApiOperation({ summary: 'List all coupons' })
  list(@Request() req: any) {
    return this.coupons.list(req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a coupon' })
  create(@Request() req: any, @Body() dto: CreateCouponDto) {
    return this.coupons.create(req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon' })
  find(@Param('id') id: string, @Request() req: any) {
    return this.coupons.findOne(id, req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.coupons.update(id, req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.coupons.remove(id, req.user.tenantId);
  }
}
