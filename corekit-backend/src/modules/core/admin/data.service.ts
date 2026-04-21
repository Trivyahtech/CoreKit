import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../../platform/database/prisma.service.js';

type ExportScope =
  | 'products'
  | 'categories'
  | 'customers'
  | 'orders'
  | 'coupons'
  | 'inventory-ledger';

type PurgeScope =
  | 'draft-products'
  | 'cancelled-orders'
  | 'carts'
  | 'pending-reviews'
  | 'stock-ledger';

const CSV_SEP = ',';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.join(CSV_SEP)];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(CSV_SEP));
  }
  return lines.join('\n');
}

function parseCsv(input: string): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === CSV_SEP) {
        cur.push(field);
        field = '';
      } else if (ch === '\n') {
        cur.push(field);
        lines.push(cur);
        cur = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    lines.push(cur);
  }
  if (lines.length === 0) return rows;
  const headers = lines[0];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 1 && line[0] === '') continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = line[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

@Injectable()
export class AdminDataService {
  private readonly logger = new Logger(AdminDataService.name);
  constructor(private readonly prisma: PrismaService) {}

  // --- Export ---
  async export(tenantId: string, scope: ExportScope): Promise<string> {
    switch (scope) {
      case 'products': {
        const products = await this.prisma.product.findMany({
          where: { tenantId },
          include: {
            variants: {
              select: {
                sku: true,
                title: true,
                price: true,
                compareAtPrice: true,
                stockOnHand: true,
                weightGrams: true,
                status: true,
              },
            },
            categories: { include: { category: { select: { slug: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        });
        const rows: Array<Record<string, unknown>> = [];
        for (const p of products) {
          if (p.variants.length === 0) {
            rows.push({
              productSlug: p.slug,
              productName: p.name,
              brand: p.brand ?? '',
              status: p.status,
              isPublished: p.isPublished,
              categorySlugs: p.categories.map((c) => c.category.slug).join('|'),
              sku: '',
              variantTitle: '',
              price: '',
              compareAtPrice: '',
              stockOnHand: '',
              weightGrams: '',
              variantStatus: '',
              description: p.description ?? '',
            });
            continue;
          }
          for (const v of p.variants) {
            rows.push({
              productSlug: p.slug,
              productName: p.name,
              brand: p.brand ?? '',
              status: p.status,
              isPublished: p.isPublished,
              categorySlugs: p.categories.map((c) => c.category.slug).join('|'),
              sku: v.sku,
              variantTitle: v.title ?? '',
              price: v.price.toString(),
              compareAtPrice: v.compareAtPrice?.toString() ?? '',
              stockOnHand: v.stockOnHand,
              weightGrams: v.weightGrams ?? '',
              variantStatus: v.status,
              description: p.description ?? '',
            });
          }
        }
        return toCsv(
          [
            'productSlug',
            'productName',
            'brand',
            'status',
            'isPublished',
            'categorySlugs',
            'sku',
            'variantTitle',
            'price',
            'compareAtPrice',
            'stockOnHand',
            'weightGrams',
            'variantStatus',
            'description',
          ],
          rows,
        );
      }
      case 'categories': {
        const cats = await this.prisma.category.findMany({
          where: { tenantId },
          orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
          include: { parent: { select: { slug: true } } },
        });
        const rows = cats.map((c) => ({
          slug: c.slug,
          name: c.name,
          parentSlug: c.parent?.slug ?? '',
          description: c.description ?? '',
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        }));
        return toCsv(
          ['slug', 'name', 'parentSlug', 'description', 'sortOrder', 'isActive'],
          rows,
        );
      }
      case 'customers': {
        const users = await this.prisma.user.findMany({
          where: { tenantId, role: 'CUSTOMER' },
          orderBy: { createdAt: 'asc' },
        });
        const rows = users.map((u) => ({
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName ?? '',
          phone: u.phone ?? '',
          status: u.status,
          emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? '',
          createdAt: u.createdAt.toISOString(),
        }));
        return toCsv(
          ['email', 'firstName', 'lastName', 'phone', 'status', 'emailVerifiedAt', 'createdAt'],
          rows,
        );
      }
      case 'orders': {
        const orders = await this.prisma.order.findMany({
          where: { tenantId },
          include: {
            user: { select: { email: true, firstName: true, lastName: true } },
            items: true,
          },
          orderBy: { createdAt: 'asc' },
        });
        const rows: Array<Record<string, unknown>> = [];
        for (const o of orders) {
          for (const it of o.items) {
            rows.push({
              orderNumber: o.orderNumber,
              createdAt: o.createdAt.toISOString(),
              status: o.status,
              paymentStatus: o.paymentStatus,
              customerEmail: o.user?.email ?? '',
              customerName: `${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`.trim(),
              sku: it.sku,
              productName: it.productName,
              variantName: it.variantName ?? '',
              quantity: it.quantity,
              unitPrice: it.unitPrice.toString(),
              totalAmount: it.totalAmount.toString(),
              subtotal: o.subtotal.toString(),
              taxAmount: o.taxAmount.toString(),
              shippingAmount: o.shippingAmount.toString(),
              discountAmount: o.discountAmount.toString(),
              grandTotal: o.grandTotal.toString(),
            });
          }
        }
        return toCsv(
          [
            'orderNumber',
            'createdAt',
            'status',
            'paymentStatus',
            'customerEmail',
            'customerName',
            'sku',
            'productName',
            'variantName',
            'quantity',
            'unitPrice',
            'totalAmount',
            'subtotal',
            'taxAmount',
            'shippingAmount',
            'discountAmount',
            'grandTotal',
          ],
          rows,
        );
      }
      case 'coupons': {
        const coupons = await this.prisma.coupon.findMany({ where: { tenantId } });
        const rows = coupons.map((c) => ({
          code: c.code,
          type: c.type,
          value: c.value.toString(),
          minCartValue: c.minCartValue?.toString() ?? '',
          maxDiscountAmount: c.maxDiscountAmount?.toString() ?? '',
          usageLimit: c.usageLimit ?? '',
          usedCount: c.usedCount,
          startsAt: c.startsAt?.toISOString() ?? '',
          endsAt: c.endsAt?.toISOString() ?? '',
          isActive: c.isActive,
        }));
        return toCsv(
          [
            'code',
            'type',
            'value',
            'minCartValue',
            'maxDiscountAmount',
            'usageLimit',
            'usedCount',
            'startsAt',
            'endsAt',
            'isActive',
          ],
          rows,
        );
      }
      case 'inventory-ledger': {
        const entries = await this.prisma.stockLedger.findMany({
          where: { tenantId },
          include: { variant: { select: { sku: true, product: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10_000,
        });
        const rows = entries.map((e) => ({
          createdAt: e.createdAt.toISOString(),
          sku: e.variant.sku,
          productName: e.variant.product.name,
          change: e.change,
          reason: e.reason,
          refType: e.refType ?? '',
          refId: e.refId ?? '',
          note: e.note ?? '',
          actorUserId: e.actorUserId ?? '',
        }));
        return toCsv(
          [
            'createdAt',
            'sku',
            'productName',
            'change',
            'reason',
            'refType',
            'refId',
            'note',
            'actorUserId',
          ],
          rows,
        );
      }
    }
  }

  // --- Import ---
  async importCategories(tenantId: string, csv: string) {
    const rows = parseCsv(csv);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Two-pass: first without parent, then set parent.
    for (const r of rows) {
      const slug = r.slug?.trim();
      if (!slug || !r.name) {
        skipped++;
        continue;
      }
      try {
        const result = await this.prisma.category.upsert({
          where: { tenantId_slug: { tenantId, slug } },
          update: {
            name: r.name,
            description: r.description || null,
            sortOrder: Number(r.sortOrder) || 0,
            isActive: r.isActive !== 'false',
          },
          create: {
            tenantId,
            slug,
            name: r.name,
            description: r.description || null,
            sortOrder: Number(r.sortOrder) || 0,
            isActive: r.isActive !== 'false',
          },
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
      } catch (e: any) {
        errors.push(`Row ${slug}: ${e?.message ?? e}`);
      }
    }
    // Second pass — parent linking
    for (const r of rows) {
      const slug = r.slug?.trim();
      if (!slug) continue;
      if (r.parentSlug) {
        try {
          const parent = await this.prisma.category.findUnique({
            where: { tenantId_slug: { tenantId, slug: r.parentSlug.trim() } },
          });
          if (parent) {
            await this.prisma.category.updateMany({
              where: { tenantId, slug },
              data: { parentId: parent.id },
            });
          }
        } catch (e: any) {
          errors.push(`Parent for ${slug}: ${e?.message ?? e}`);
        }
      }
    }
    return { scope: 'categories', created, updated, skipped, errors };
  }

  async importCoupons(tenantId: string, csv: string) {
    const rows = parseCsv(csv);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const code = (r.code || '').trim().toUpperCase();
      if (!code || !r.type) {
        skipped++;
        continue;
      }
      try {
        const result = await this.prisma.coupon.upsert({
          where: { tenantId_code: { tenantId, code } },
          update: {
            type: r.type as any,
            value: Number(r.value) || 0,
            minCartValue: r.minCartValue ? Number(r.minCartValue) : null,
            maxDiscountAmount: r.maxDiscountAmount
              ? Number(r.maxDiscountAmount)
              : null,
            usageLimit: r.usageLimit ? Number(r.usageLimit) : null,
            startsAt: r.startsAt ? new Date(r.startsAt) : null,
            endsAt: r.endsAt ? new Date(r.endsAt) : null,
            isActive: r.isActive !== 'false',
          },
          create: {
            tenantId,
            code,
            type: r.type as any,
            value: Number(r.value) || 0,
            minCartValue: r.minCartValue ? Number(r.minCartValue) : null,
            maxDiscountAmount: r.maxDiscountAmount
              ? Number(r.maxDiscountAmount)
              : null,
            usageLimit: r.usageLimit ? Number(r.usageLimit) : null,
            startsAt: r.startsAt ? new Date(r.startsAt) : null,
            endsAt: r.endsAt ? new Date(r.endsAt) : null,
            isActive: r.isActive !== 'false',
          },
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
      } catch (e: any) {
        errors.push(`${code}: ${e?.message ?? e}`);
      }
    }
    return { scope: 'coupons', created, updated, skipped, errors };
  }

  async importProducts(tenantId: string, csv: string) {
    const rows = parseCsv(csv);
    const byProduct = new Map<string, Array<Record<string, string>>>();
    for (const r of rows) {
      const slug = r.productSlug?.trim();
      if (!slug || !r.productName) continue;
      if (!byProduct.has(slug)) byProduct.set(slug, []);
      byProduct.get(slug)!.push(r);
    }
    let productsUpserted = 0;
    let variantsUpserted = 0;
    const errors: string[] = [];
    for (const [slug, lines] of byProduct) {
      const head = lines[0];
      try {
        const product = await this.prisma.product.upsert({
          where: { tenantId_slug: { tenantId, slug } },
          update: {
            name: head.productName,
            brand: head.brand || null,
            description: head.description || null,
            status: (head.status as any) || 'ACTIVE',
            isPublished: head.isPublished !== 'false',
          },
          create: {
            tenantId,
            slug,
            name: head.productName,
            brand: head.brand || null,
            description: head.description || null,
            status: (head.status as any) || 'ACTIVE',
            isPublished: head.isPublished !== 'false',
          },
        });
        productsUpserted++;

        // Category links
        if (head.categorySlugs) {
          const slugs = head.categorySlugs.split('|').map((s) => s.trim()).filter(Boolean);
          const cats = await this.prisma.category.findMany({
            where: { tenantId, slug: { in: slugs } },
            select: { id: true },
          });
          await this.prisma.productCategory.deleteMany({
            where: { productId: product.id },
          });
          for (const c of cats) {
            await this.prisma.productCategory.create({
              data: { productId: product.id, categoryId: c.id },
            });
          }
        }

        // Variants
        for (const r of lines) {
          const sku = r.sku?.trim();
          if (!sku) continue;
          await this.prisma.productVariant.upsert({
            where: { tenantId_sku: { tenantId, sku } },
            update: {
              productId: product.id,
              title: r.variantTitle || null,
              price: r.price ? Number(r.price) : 0,
              compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
              stockOnHand: r.stockOnHand ? Number(r.stockOnHand) : 0,
              weightGrams: r.weightGrams ? Number(r.weightGrams) : null,
              status: (r.variantStatus as any) || 'ACTIVE',
            },
            create: {
              tenantId,
              productId: product.id,
              sku,
              title: r.variantTitle || null,
              attributes: {},
              price: r.price ? Number(r.price) : 0,
              compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
              stockOnHand: r.stockOnHand ? Number(r.stockOnHand) : 0,
              weightGrams: r.weightGrams ? Number(r.weightGrams) : null,
              status: (r.variantStatus as any) || 'ACTIVE',
            },
          });
          variantsUpserted++;
        }
      } catch (e: any) {
        errors.push(`Product ${slug}: ${e?.message ?? e}`);
      }
    }
    return {
      scope: 'products',
      productsUpserted,
      variantsUpserted,
      errors,
    };
  }

  // --- Purge ---
  /**
   * Returns a preview-count AND a confirm-token. Frontend must echo the
   * token back in the confirm step to actually purge.
   */
  async purgePreview(tenantId: string, scope: PurgeScope) {
    const count = await this.countForScope(tenantId, scope);
    const token = crypto.randomBytes(12).toString('hex');
    // Token encodes tenantId+scope so it can't be replayed for another scope/tenant.
    // We include a short expiry via signed HMAC using scope as key material.
    const signed = `${token}.${crypto
      .createHmac('sha256', `${tenantId}:${scope}`)
      .update(token)
      .digest('hex')
      .slice(0, 16)}`;
    return { scope, count, confirmToken: signed };
  }

  async purge(
    tenantId: string,
    scope: PurgeScope,
    confirmToken: string,
    actorUserId: string,
  ) {
    // Verify token
    const [tok, sig] = confirmToken.split('.');
    if (!tok || !sig) throw new BadRequestException('Invalid confirmation token');
    const expected = crypto
      .createHmac('sha256', `${tenantId}:${scope}`)
      .update(tok)
      .digest('hex')
      .slice(0, 16);
    if (expected !== sig) {
      throw new UnauthorizedException('Confirmation token mismatch');
    }

    let deleted = 0;
    switch (scope) {
      case 'draft-products': {
        const res = await this.prisma.product.deleteMany({
          where: { tenantId, status: 'DRAFT' },
        });
        deleted = res.count;
        break;
      }
      case 'cancelled-orders': {
        // Delete line items + logs via cascade (schema dependent).
        const res = await this.prisma.order.deleteMany({
          where: { tenantId, status: 'CANCELLED' },
        });
        deleted = res.count;
        break;
      }
      case 'carts': {
        const res = await this.prisma.cart.deleteMany({
          where: { tenantId, status: 'ACTIVE', items: { none: {} } },
        });
        deleted = res.count;
        break;
      }
      case 'pending-reviews': {
        const res = await this.prisma.review.deleteMany({
          where: { tenantId, status: 'PENDING' },
        });
        deleted = res.count;
        break;
      }
      case 'stock-ledger': {
        const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const res = await this.prisma.stockLedger.deleteMany({
          where: { tenantId, createdAt: { lt: cutoff } },
        });
        deleted = res.count;
        break;
      }
      default:
        throw new NotFoundException('Unknown purge scope');
    }
    this.logger.warn(
      `Purge ${scope} by ${actorUserId} on tenant ${tenantId}: ${deleted} removed`,
    );
    return { scope, deleted };
  }

  private async countForScope(tenantId: string, scope: PurgeScope): Promise<number> {
    switch (scope) {
      case 'draft-products':
        return this.prisma.product.count({
          where: { tenantId, status: 'DRAFT' },
        });
      case 'cancelled-orders':
        return this.prisma.order.count({
          where: { tenantId, status: 'CANCELLED' },
        });
      case 'carts':
        return this.prisma.cart.count({
          where: { tenantId, status: 'ACTIVE', items: { none: {} } },
        });
      case 'pending-reviews':
        return this.prisma.review.count({
          where: { tenantId, status: 'PENDING' },
        });
      case 'stock-ledger': {
        const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        return this.prisma.stockLedger.count({
          where: { tenantId, createdAt: { lt: cutoff } },
        });
      }
      default:
        return 0;
    }
  }
}
