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
import { ShippingService } from './shipping.service.js';
import {
  CreateShippingRuleDto,
  CreateShippingZoneDto,
  QuoteShippingDto,
} from './dto/create-shipping.dto.js';
import {
  UpdateShippingRuleDto,
  UpdateShippingZoneDto,
} from './dto/update-shipping.dto.js';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Quote shipping rates for a pincode' })
  quote(@Request() req: any, @Body() dto: QuoteShippingDto) {
    return this.shippingService.quote(req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post('zones')
  @ApiOperation({ summary: 'Create a shipping zone (admin/staff)' })
  createZone(@Request() req: any, @Body() dto: CreateShippingZoneDto) {
    return this.shippingService.createZone(req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('zones')
  @ApiOperation({ summary: 'List shipping zones for caller tenant' })
  listZones(@Request() req: any) {
    return this.shippingService.listZones(req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('zones/:id')
  @ApiOperation({ summary: 'Get a shipping zone with rules' })
  getZone(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.getZone(id, req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch('zones/:id')
  @ApiOperation({ summary: 'Update a shipping zone' })
  updateZone(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingService.updateZone(id, req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('zones/:id')
  @ApiOperation({ summary: 'Delete a shipping zone' })
  deleteZone(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.deleteZone(id, req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post('zones/:zoneId/rules')
  @ApiOperation({ summary: 'Add a rule to a shipping zone' })
  addRule(
    @Param('zoneId') zoneId: string,
    @Request() req: any,
    @Body() dto: CreateShippingRuleDto,
  ) {
    return this.shippingService.addRule(zoneId, req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch('rules/:ruleId')
  @ApiOperation({ summary: 'Update a shipping rule' })
  updateRule(
    @Param('ruleId') ruleId: string,
    @Request() req: any,
    @Body() dto: UpdateShippingRuleDto,
  ) {
    return this.shippingService.updateRule(ruleId, req.user.tenantId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete a shipping rule' })
  deleteRule(@Param('ruleId') ruleId: string, @Request() req: any) {
    return this.shippingService.deleteRule(ruleId, req.user.tenantId);
  }
}
