import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto.js';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new BadRequestException(`Code "${code}" already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        tenantId,
        code,
        type: dto.type,
        value: dto.value,
        minCartValue: dto.minCartValue,
        maxDiscountAmount: dto.maxDiscountAmount,
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, tenantId },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, tenantId: string, dto: UpdateCouponDto) {
    await this.findOne(id, tenantId);
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code.trim().toUpperCase();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minCartValue !== undefined) data.minCartValue = dto.minCartValue;
    if (dto.maxDiscountAmount !== undefined)
      data.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.startsAt !== undefined)
      data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined)
      data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }
}
