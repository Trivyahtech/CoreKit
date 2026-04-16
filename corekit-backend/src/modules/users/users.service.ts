import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) return [];

    return this.prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
  }
}
