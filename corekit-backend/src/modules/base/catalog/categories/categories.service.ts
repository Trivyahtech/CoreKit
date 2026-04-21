import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/database/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const existing = await this.prisma.category.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: dto.slug } },
    });

    if (existing) {
      throw new BadRequestException(`Category slug "${dto.slug}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { children: true, parent: true },
    });
  }

  async findAll(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    return this.prisma.category.findMany({
      where: { tenantId: tenant.id },
      include: { children: true, parent: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOnePublic(id: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const category = await this.prisma.category.findFirst({
      where: { id, tenantId: tenant.id, isActive: true },
      include: {
        children: true,
        parent: true,
        products: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, status: true, isPublished: true },
            },
          },
          where: { product: { isPublished: true } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, tenantId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not in this tenant');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { children: true, parent: true },
    });
  }

  async remove(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
