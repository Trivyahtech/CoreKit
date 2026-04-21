import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client-runtime-utils';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import {
  CreateShippingRuleDto,
  CreateShippingZoneDto,
  QuoteShippingDto,
} from './dto/create-shipping.dto.js';
import {
  UpdateShippingRuleDto,
  UpdateShippingZoneDto,
} from './dto/update-shipping.dto.js';

export interface ShippingQuote {
  ruleId: string;
  zoneId: string;
  name: string;
  method: string;
  cost: string;
  isCodAllowed: boolean;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Zones ---
  async createZone(tenantId: string, dto: CreateShippingZoneDto) {
    return this.prisma.shippingZone.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type ?? 'PINCODE',
        pincodes: dto.pincodes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listZones(tenantId: string) {
    return this.prisma.shippingZone.findMany({
      where: { tenantId },
      include: { rules: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getZone(id: string, tenantId: string) {
    const zone = await this.prisma.shippingZone.findFirst({
      where: { id, tenantId },
      include: { rules: true },
    });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async updateZone(id: string, tenantId: string, dto: UpdateShippingZoneDto) {
    const zone = await this.prisma.shippingZone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.pincodes !== undefined && { pincodes: dto.pincodes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteZone(id: string, tenantId: string) {
    const zone = await this.prisma.shippingZone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    await this.prisma.shippingZone.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Rules ---
  async addRule(zoneId: string, tenantId: string, dto: CreateShippingRuleDto) {
    await this.getZone(zoneId, tenantId);
    return this.prisma.shippingRule.create({
      data: {
        zoneId,
        name: dto.name,
        method: dto.method,
        minWeightGrams: dto.minWeightGrams ?? null,
        maxWeightGrams: dto.maxWeightGrams ?? null,
        flatRate: dto.flatRate != null ? new Decimal(dto.flatRate) : null,
        ratePerKg: dto.ratePerKg != null ? new Decimal(dto.ratePerKg) : null,
        minOrderValue: dto.minOrderValue != null ? new Decimal(dto.minOrderValue) : null,
        isCodAllowed: dto.isCodAllowed ?? true,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateRule(ruleId: string, tenantId: string, dto: UpdateShippingRuleDto) {
    const rule = await this.prisma.shippingRule.findFirst({
      where: { id: ruleId, zone: { tenantId } },
    });
    if (!rule) throw new NotFoundException('Shipping rule not found');
    return this.prisma.shippingRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.method !== undefined && { method: dto.method }),
        ...(dto.minWeightGrams !== undefined && { minWeightGrams: dto.minWeightGrams }),
        ...(dto.maxWeightGrams !== undefined && { maxWeightGrams: dto.maxWeightGrams }),
        ...(dto.flatRate !== undefined && {
          flatRate: dto.flatRate != null ? new Decimal(dto.flatRate) : null,
        }),
        ...(dto.ratePerKg !== undefined && {
          ratePerKg: dto.ratePerKg != null ? new Decimal(dto.ratePerKg) : null,
        }),
        ...(dto.minOrderValue !== undefined && {
          minOrderValue: dto.minOrderValue != null ? new Decimal(dto.minOrderValue) : null,
        }),
        ...(dto.isCodAllowed !== undefined && { isCodAllowed: dto.isCodAllowed }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteRule(ruleId: string, tenantId: string) {
    const rule = await this.prisma.shippingRule.findFirst({
      where: { id: ruleId, zone: { tenantId } },
    });
    if (!rule) throw new NotFoundException('Shipping rule not found');
    await this.prisma.shippingRule.delete({ where: { id: ruleId } });
    return { deleted: true };
  }

  // --- Quote ---
  async quote(tenantId: string, dto: QuoteShippingDto): Promise<ShippingQuote[]> {
    if (!dto.pincode) {
      throw new BadRequestException('pincode required');
    }

    const zones = await this.prisma.shippingZone.findMany({
      where: { tenantId, isActive: true },
      include: { rules: { where: { isActive: true } } },
    });

    const pincode = dto.pincode.trim();
    const matchingZone = zones.find((z) => {
      const list = Array.isArray(z.pincodes) ? (z.pincodes as string[]) : [];
      return list.includes(pincode);
    });
    if (!matchingZone) {
      throw new NotFoundException('No shipping zone serves this pincode');
    }

    const weightGrams = dto.weightGrams ?? 0;
    const orderValue = new Decimal(dto.orderValue ?? 0);

    const quotes: ShippingQuote[] = [];
    for (const rule of matchingZone.rules) {
      if (rule.minWeightGrams != null && weightGrams < rule.minWeightGrams) continue;
      if (rule.maxWeightGrams != null && weightGrams > rule.maxWeightGrams) continue;
      if (rule.minOrderValue != null && orderValue.lessThan(rule.minOrderValue)) continue;

      let cost = new Decimal(0);
      if (rule.flatRate) cost = cost.add(rule.flatRate);
      if (rule.ratePerKg) {
        const kg = new Decimal(weightGrams).div(1000);
        cost = cost.add(rule.ratePerKg.mul(kg));
      }

      quotes.push({
        ruleId: rule.id,
        zoneId: matchingZone.id,
        name: rule.name,
        method: rule.method,
        cost: cost.toFixed(2),
        isCodAllowed: rule.isCodAllowed,
      });
    }

    return quotes;
  }
}
