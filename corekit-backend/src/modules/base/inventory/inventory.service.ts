import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { StockChangeReason } from '@prisma/client';

/**
 * Inventory service — owns the stock ledger + lot lifecycle.
 * Every stock-affecting operation in the system should go through `record()`
 * so we have a complete, queryable audit trail.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a stock ledger entry. Does NOT mutate the variant stockOnHand —
   * callers that already update stock within a transaction should call this
   * for the audit row. Callers that want the service to bump stock should
   * use `adjust()`.
   */
  async record(
    tx: any,
    params: {
      tenantId: string;
      variantId: string;
      change: number;
      reason: StockChangeReason;
      refType?: string;
      refId?: string;
      note?: string;
      actorUserId?: string;
    },
  ) {
    return tx.stockLedger.create({
      data: {
        tenantId: params.tenantId,
        variantId: params.variantId,
        change: params.change,
        reason: params.reason,
        refType: params.refType,
        refId: params.refId,
        note: params.note,
        actorUserId: params.actorUserId,
      },
    });
  }

  /**
   * Apply a manual stock adjustment with full audit.
   */
  async adjust(params: {
    tenantId: string;
    variantId: string;
    change: number;
    reason: StockChangeReason;
    note?: string;
    actorUserId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.update({
        where: { id: params.variantId },
        data: { stockOnHand: { increment: params.change } },
      });
      await this.record(tx, {
        tenantId: params.tenantId,
        variantId: params.variantId,
        change: params.change,
        reason: params.reason,
        note: params.note,
        actorUserId: params.actorUserId,
      });
      return v;
    });
  }

  async listLedger(
    tenantId: string,
    opts: { variantId?: string; limit?: number; offset?: number } = {},
  ) {
    const take = Math.min(opts.limit ?? 50, 200);
    return this.prisma.stockLedger.findMany({
      where: {
        tenantId,
        ...(opts.variantId && { variantId: opts.variantId }),
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip: opts.offset ?? 0,
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            title: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async listLots(
    tenantId: string,
    opts: { variantId?: string; onlyRemaining?: boolean } = {},
  ) {
    return this.prisma.inventoryLot.findMany({
      where: {
        tenantId,
        ...(opts.variantId && { variantId: opts.variantId }),
        ...(opts.onlyRemaining && { remaining: { gt: 0 } }),
      },
      orderBy: [{ receivedAt: 'desc' }],
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            title: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async summary(tenantId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        sku: true,
        title: true,
        stockOnHand: true,
        reservedStock: true,
        product: { select: { id: true, name: true } },
      },
      orderBy: { stockOnHand: 'asc' },
    });

    const totalUnits = variants.reduce((s, v) => s + v.stockOnHand, 0);
    const reserved = variants.reduce((s, v) => s + v.reservedStock, 0);
    const outOfStock = variants.filter((v) => v.stockOnHand === 0).length;
    const lowStock = variants.filter(
      (v) => v.stockOnHand > 0 && v.stockOnHand < 10,
    ).length;

    return {
      totalSkus: variants.length,
      totalUnits,
      reserved,
      outOfStock,
      lowStock,
      lowStockVariants: variants
        .filter((v) => v.stockOnHand < 10)
        .slice(0, 20),
    };
  }

  /**
   * Consume a quantity across available lots for a variant (FIFO).
   * Writes per-lot adjustments and returns lot allocation used.
   */
  async consumeLots(
    tx: any,
    params: {
      tenantId: string;
      variantId: string;
      quantity: number;
    },
  ) {
    const lots = await tx.inventoryLot.findMany({
      where: {
        tenantId: params.tenantId,
        variantId: params.variantId,
        remaining: { gt: 0 },
      },
      orderBy: { receivedAt: 'asc' },
    });
    let remaining = params.quantity;
    const used: Array<{ lotId: string; take: number }> = [];
    for (const lot of lots) {
      if (remaining === 0) break;
      const take = Math.min(lot.remaining, remaining);
      await tx.inventoryLot.update({
        where: { id: lot.id },
        data: { remaining: lot.remaining - take },
      });
      used.push({ lotId: lot.id, take });
      remaining -= take;
    }
    return { fulfilled: params.quantity - remaining, lotsUsed: used };
  }
}
