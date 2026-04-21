import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, opts: { search?: string } = {}) {
    const search = opts.search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.CUSTOMER,
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const aggregates = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { tenantId, userId: { in: users.map((u) => u.id) } },
      _count: { _all: true },
      _sum: { grandTotal: true },
      _max: { createdAt: true },
    });
    const byUserId = new Map(aggregates.map((a) => [a.userId, a]));

    return users.map((u) => {
      const agg = byUserId.get(u.id);
      return {
        ...u,
        ordersCount: agg?._count._all ?? 0,
        lifetimeValue: agg?._sum.grandTotal?.toString() ?? '0',
        lastOrderAt: agg?._max.createdAt ?? null,
      };
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, role: UserRole.CUSTOMER },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('Customer not found');

    const [orders, addresses, reviews] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: id, tenantId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      this.prisma.address.findMany({
        where: { userId: id, tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.findMany({
        where: { userId: id, tenantId },
        select: {
          id: true,
          rating: true,
          title: true,
          status: true,
          createdAt: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const agg = await this.prisma.order.aggregate({
      where: { userId: id, tenantId },
      _count: { _all: true },
      _sum: { grandTotal: true },
    });

    return {
      ...user,
      ordersCount: agg._count._all,
      lifetimeValue: agg._sum.grandTotal?.toString() ?? '0',
      orders,
      addresses,
      reviews,
    };
  }

  async audit(id: string, tenantId: string, limit = 50) {
    // Every product given to this customer — derived from order items.
    const take = Math.min(limit, 200);
    const items = await this.prisma.orderItem.findMany({
      where: { order: { userId: id, tenantId } },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return items.map((it) => ({
      orderId: it.order.id,
      orderNumber: it.order.orderNumber,
      orderStatus: it.order.status,
      placedAt: it.order.createdAt,
      productId: it.productId,
      productName: it.productName,
      variantName: it.variantName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice.toString(),
      totalAmount: it.totalAmount.toString(),
    }));
  }
}
