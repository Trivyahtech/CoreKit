import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../platform/database/prisma.service.js';
import { StorageService } from '../../../../platform/storage/storage.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto.js';
import { ProductStatus, VariantStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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

  async findAllPublic(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      include: {
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { status: 'ACTIVE' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.product.findMany({
      where,
      include: {
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePublic(id: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const product = await this.prisma.product.findFirst({
      where: { id, tenantId: tenant.id, isPublished: true },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } },
        reviews: { where: { status: 'APPROVED' }, take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findOneAdmin(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
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

  async publish(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ACTIVE, isPublished: true },
    });
  }

  async unpublish(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT, isPublished: false },
    });
  }

  async assignCategories(productId: string, tenantId: string, categoryIds: string[]) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (categoryIds.length > 0) {
      const valid = await this.prisma.category.count({
        where: { id: { in: categoryIds }, tenantId },
      });
      if (valid !== categoryIds.length) {
        throw new BadRequestException('One or more categories do not belong to this tenant');
      }
    }

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

  async remove(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Variants ---

  async createVariant(productId: string, tenantId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const duplicate = await this.prisma.productVariant.findUnique({
      where: { tenantId_sku: { tenantId, sku: dto.sku } },
    });
    if (duplicate) {
      throw new BadRequestException(`SKU "${dto.sku}" already exists`);
    }

    return this.prisma.productVariant.create({
      data: {
        tenantId,
        productId,
        sku: dto.sku,
        title: dto.title,
        attributes: (dto.attributes ?? {}) as any,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        stockOnHand: dto.stockOnHand ?? 0,
        weightGrams: dto.weightGrams,
        status: dto.isActive === false ? VariantStatus.INACTIVE : VariantStatus.ACTIVE,
      },
    });
  }

  async updateVariant(variantId: string, tenantId: string, dto: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.attributes !== undefined) data.attributes = dto.attributes as any;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.compareAtPrice !== undefined) data.compareAtPrice = dto.compareAtPrice;
    if (dto.stockOnHand !== undefined) data.stockOnHand = dto.stockOnHand;
    if (dto.weightGrams !== undefined) data.weightGrams = dto.weightGrams;
    if (dto.isActive !== undefined) {
      data.status = dto.isActive ? VariantStatus.ACTIVE : VariantStatus.INACTIVE;
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async removeVariant(variantId: string, tenantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
      include: { orderItems: { select: { id: true }, take: 1 } },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.orderItems.length > 0) {
      throw new BadRequestException(
        'Variant has order history — archive it instead of deleting.',
      );
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { deleted: true };
  }

  // --- Images ---

  async uploadImage(
    productId: string,
    tenantId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    altText?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const stored = await this.storage.upload(
      tenantId,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      `products/${productId}`,
    );

    const sortOrder = (product.images[product.images.length - 1]?.sortOrder ?? -1) + 1;
    const isPrimary = product.images.length === 0;

    return this.prisma.productImage.create({
      data: {
        productId,
        url: stored.url,
        altText,
        sortOrder,
        isPrimary,
      },
    });
  }

  async listImages(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async setPrimaryImage(productId: string, imageId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
    return { ok: true };
  }

  async removeImage(productId: string, imageId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    return { deleted: true };
  }
}
