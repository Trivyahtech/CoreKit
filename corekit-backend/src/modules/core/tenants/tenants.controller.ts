import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { TenantsService } from './tenants.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post()
  @ApiOperation({
    summary: 'Provision a new tenant with an initial admin user',
    description:
      'Requires the X-Provisioning-Secret header to match TENANT_PROVISIONING_SECRET.',
  })
  async provision(
    @Headers('x-provisioning-secret') secret: string | undefined,
    @Body() dto: CreateTenantDto,
  ) {
    const expected = this.config.get<string>('TENANT_PROVISIONING_SECRET');
    if (!expected) {
      throw new UnauthorizedException('Tenant provisioning is disabled');
    }
    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid provisioning secret');
    }
    return this.tenants.provision(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public minimal tenant list (id, slug, name)' })
  async list() {
    const tenants = await this.tenants.list();
    return tenants.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
  }

  @ApiBearerAuth()
  @Get('current')
  @ApiOperation({ summary: 'Get the caller’s own tenant details' })
  async getCurrent(@Request() req: any) {
    return this.tenants.getCurrent(req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('current')
  @ApiOperation({ summary: 'Update the caller’s own tenant (admin only)' })
  async updateCurrent(
    @Request() req: any,
    @Body()
    dto: {
      name?: string;
      currencyCode?: string;
      defaultCountry?: string;
      timezone?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    return this.tenants.updateCurrent(req.user.tenantId, dto);
  }
}
