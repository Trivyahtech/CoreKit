import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const existing = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: dto.slug } },
    });

    if (existing) {
      throw new BadRequestException(`Product slug "${dto.slug}" already exists`);
    }

    return this.prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        slug: dto.slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        brand: dto.brand,
        taxCode: dto.taxCode,
        taxRate: dto.taxRate,
        status: ProductStatus.DRAFT,
        isPublished: false,
        ...(dto.categoryIds?.length && {
          categories: {
            create: dto.categoryIds.map((categoryId) => ({ categoryId })),
          },
        }),
      },
      include: {
        categories: { include: { category: true } },
        images: true,
        variants: true,
      },
    });
  }

  async findAll(tenantSlug: string, status?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const where: any = { tenantId: tenant.id };
    if (status) {
      where.status = status;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { status: 'ACTIVE' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        reviews: { where: { status: 'APPROVED' }, take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.taxCode !== undefined && { taxCode: dto.taxCode }),
        ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
      },
      include: {
        categories: { include: { category: true } },
        images: true,
        variants: true,
      },
    });
  }

  async publish(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ACTIVE, isPublished: true },
    });
  }

  async unpublish(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT, isPublished: false },
    });
  }

  async assignCategories(productId: string, categoryIds: string[]) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Remove existing assignments and replace
    await this.prisma.productCategory.deleteMany({ where: { productId } });

    if (categoryIds.length > 0) {
      await this.prisma.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      });
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { categories: { include: { category: true } } },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
