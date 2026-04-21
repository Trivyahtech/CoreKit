import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto.js';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tenantId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findFirst({
      where: { tenantId, productId: dto.productId, userId },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verified purchase = user has a COMPLETED or SHIPPED order containing this product
    const hasOrder = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          userId,
          tenantId,
          status: { in: ['SHIPPED', 'COMPLETED'] },
        },
      },
      select: { id: true },
    });

    return this.prisma.review.create({
      data: {
        tenantId,
        productId: dto.productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        isVerifiedPurchase: !!hasOrder,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async listApprovedForProduct(productId: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.review.findMany({
      where: {
        tenantId: tenant.id,
        productId,
        status: ReviewStatus.APPROVED,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForModeration(
    tenantId: string,
    status?: ReviewStatus,
  ) {
    return this.prisma.review.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(
    id: string,
    tenantId: string,
    dto: ModerateReviewDto,
    moderatorId: string,
  ) {
    const review = await this.prisma.review.findFirst({
      where: { id, tenantId },
    });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id },
      data: {
        status: dto.status,
        // lightweight audit — stash moderator id in a field the model supports
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, tenantId },
    });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }

  async stats(tenantId: string) {
    const grouped = await this.prisma.review.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });
    return grouped.reduce<Record<string, number>>(
      (acc, g) => {
        acc[g.status] = g._count.status;
        return acc;
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0 },
    );
  }
}
