import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tenantId: string, dto: CreateAddressDto) {
    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, tenantId, type: dto.type ?? 'SHIPPING', isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        tenantId,
        userId,
        type: dto.type ?? 'SHIPPING',
        fullName: dto.fullName,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        landmark: dto.landmark,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'India',
        pincode: dto.pincode,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async findAll(userId: string, tenantId: string) {
    return this.prisma.address.findMany({
      where: { userId, tenantId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async update(id: string, userId: string, tenantId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, tenantId, type: address.type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async setDefault(id: string, userId: string, tenantId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.address.updateMany({
      where: { userId, tenantId, type: address.type, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.address.update({ where: { id }, data: { isDefault: true } });
  }

  async remove(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }
}
