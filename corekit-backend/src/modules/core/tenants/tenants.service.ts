import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client-runtime-utils';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CacheService } from '../../../platform/cache/cache.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';

export interface TenantConfig {
  tenantId: string;
  slug: string;
  currencyCode: string;
  defaultCountry: string;
  timezone: string;
  taxRate: Decimal;
  shippingEnabled: boolean;
  freeShippingThreshold: Decimal | null;
}

const CACHE_TTL_SECONDS = 300;
const DEFAULT_TAX_RATE = new Decimal(0.18);

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getConfig(tenantId: string): Promise<TenantConfig> {
    const cacheKey = `tenant:config:${tenantId}`;
    const redis = this.cache.getClient();
    const cached = await redis.get(cacheKey);
    if (cached) return this.hydrate(JSON.parse(cached));

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        currencyCode: true,
        defaultCountry: true,
        timezone: true,
        settings: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
    const raw: TenantConfigWire = {
      tenantId: tenant.id,
      slug: tenant.slug,
      currencyCode: tenant.currencyCode,
      defaultCountry: tenant.defaultCountry,
      timezone: tenant.timezone,
      taxRate: String(settings.taxRate ?? DEFAULT_TAX_RATE.toString()),
      shippingEnabled: settings.shippingEnabled !== false,
      freeShippingThreshold:
        settings.freeShippingThreshold != null
          ? String(settings.freeShippingThreshold)
          : null,
    };

    await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(raw));
    return this.hydrate(raw);
  }

  async invalidate(tenantId: string) {
    await this.cache.getClient().del(`tenant:config:${tenantId}`);
  }

  async provision(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Tenant slug already taken');

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          currencyCode: dto.currencyCode ?? 'INR',
          defaultCountry: dto.defaultCountry ?? 'IN',
          timezone: dto.timezone ?? 'Asia/Kolkata',
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        select: { id: true, email: true, role: true },
      });

      return { tenant, admin };
    });

    return result;
  }

  async list() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        currencyCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCurrent(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!t) throw new NotFoundException('Tenant not found');
    return t;
  }

  async updateCurrent(
    tenantId: string,
    dto: {
      name?: string;
      currencyCode?: string;
      defaultCountry?: string;
      timezone?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const currentSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
    const mergedSettings = dto.settings
      ? { ...currentSettings, ...dto.settings }
      : currentSettings;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name ?? tenant.name,
        currencyCode: dto.currencyCode ?? tenant.currencyCode,
        defaultCountry: dto.defaultCountry ?? tenant.defaultCountry,
        timezone: dto.timezone ?? tenant.timezone,
        settings: mergedSettings as any,
      },
    });
    await this.invalidate(tenantId);
    return updated;
  }

  private hydrate(raw: TenantConfigWire): TenantConfig {
    return {
      tenantId: raw.tenantId,
      slug: raw.slug,
      currencyCode: raw.currencyCode,
      defaultCountry: raw.defaultCountry,
      timezone: raw.timezone,
      taxRate: new Decimal(raw.taxRate),
      shippingEnabled: raw.shippingEnabled,
      freeShippingThreshold:
        raw.freeShippingThreshold != null ? new Decimal(raw.freeShippingThreshold) : null,
    };
  }
}

interface TenantConfigWire {
  tenantId: string;
  slug: string;
  currencyCode: string;
  defaultCountry: string;
  timezone: string;
  taxRate: string;
  shippingEnabled: boolean;
  freeShippingThreshold: string | null;
}
