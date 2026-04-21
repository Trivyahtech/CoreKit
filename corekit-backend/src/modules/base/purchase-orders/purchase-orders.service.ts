import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Decimal } from '@prisma/client-runtime-utils';
import {
  PurchaseOrderStatus,
  StockChangeReason,
  VariantStatus,
} from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';

type CreatePoItem = {
  variantId: string;
  quantity: number;
  unitCost: number;
};

type ReceivePoItem = {
  itemId: string;
  quantityReceived: number;
  lotNumber?: string;
  expiryAt?: string | null;
};

const PO_TRANSITIONS: Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [
    PurchaseOrderStatus.ORDERED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.ORDERED]: [PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.PARTIAL]: [PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.RECEIVED]: [],
  [PurchaseOrderStatus.CANCELLED]: [],
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  // --- Suppliers ---

  listSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(
    tenantId: string,
    dto: { name: string; email?: string; phone?: string; address?: string; notes?: string },
  ) {
    return this.prisma.supplier.create({
      data: { tenantId, ...dto },
    });
  }

  async updateSupplier(
    id: string,
    tenantId: string,
    dto: Partial<{ name: string; email: string; phone: string; address: string; notes: string; isActive: boolean }>,
  ) {
    const s = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Supplier not found');
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async removeSupplier(id: string, tenantId: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Supplier not found');
    await this.prisma.supplier.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Purchase Orders ---

  private assertTransition(from: PurchaseOrderStatus, to: PurchaseOrderStatus) {
    if (from === to) {
      throw new BadRequestException(`Purchase order is already in status ${to}`);
    }
    const allowed = PO_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Invalid status transition: ${from} -> ${to}`);
    }
  }

  private async nextPoNumber(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    tenantId: string,
  ): Promise<string> {
    const newId = randomUUID();
    const rows = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "Counter" ("id", "tenantId", "key", "value", "updatedAt")
      VALUES (${newId}, ${tenantId}, 'purchase-order', 1, NOW())
      ON CONFLICT ("tenantId", "key")
      DO UPDATE SET "value" = "Counter"."value" + 1, "updatedAt" = NOW()
      RETURNING "value"
    `;
    const seq = rows[0]?.value ?? 1;
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `PO-${yy}${mm}-${String(seq).padStart(5, '0')}`;
  }

  async list(tenantId: string, status?: PurchaseOrderStatus) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            received: true,
            unitCost: true,
            totalCost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listCatalogVariants(tenantId: string) {
    return this.prisma.productVariant.findMany({
      where: {
        tenantId,
        status: VariantStatus.ACTIVE,
        product: { deletedAt: null },
      },
      select: {
        id: true,
        sku: true,
        title: true,
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: {
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
        },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: {
      supplierId: string;
      expectedAt?: string;
      notes?: string;
      items: CreatePoItem[];
    },
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException('Purchase order needs at least one item');
    }
    for (const item of dto.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Quantity must be a positive integer');
      }
      if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
        throw new BadRequestException('Unit cost must be zero or greater');
      }
    }

    const subtotal = dto.items.reduce(
      (s, it) => s.add(new Decimal(it.unitCost).mul(it.quantity)),
      new Decimal(0),
    );

    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: dto.supplierId, tenantId },
        select: { id: true },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');

      // Verify variants exist in tenant
      const variantIds = dto.items.map((i) => i.variantId);
      const variantCount = await tx.productVariant.count({
        where: { id: { in: variantIds }, tenantId },
      });
      if (variantCount !== new Set(variantIds).size) {
        throw new BadRequestException('One or more variants do not exist');
      }

      const poNumber = await this.nextPoNumber(tx, tenantId);

      return tx.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: dto.supplierId,
          poNumber,
          status: PurchaseOrderStatus.DRAFT,
          subtotal,
          notes: dto.notes,
          expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
          createdById: actorUserId,
          items: {
            create: dto.items.map((it) => ({
              variantId: it.variantId,
              quantity: it.quantity,
              unitCost: it.unitCost,
              totalCost: new Decimal(it.unitCost).mul(it.quantity),
            })),
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });
    });
  }

  async setStatus(
    id: string,
    tenantId: string,
    status: PurchaseOrderStatus,
  ) {
    const po = await this.findOne(id, tenantId);
    if (
      status === PurchaseOrderStatus.PARTIAL ||
      status === PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        'PARTIAL and RECEIVED are managed by receiving inventory, not manual status updates',
      );
    }
    this.assertTransition(po.status, status);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  async receive(
    id: string,
    tenantId: string,
    actorUserId: string,
    dto: { items: ReceivePoItem[]; note?: string },
  ) {
    const po = await this.findOne(id, tenantId);
    if (
      po.status !== PurchaseOrderStatus.ORDERED &&
      po.status !== PurchaseOrderStatus.PARTIAL
    ) {
      throw new BadRequestException(
        'Only ORDERED or PARTIAL purchase orders can be received',
      );
    }
    const lines = dto.items
      .map((line) => ({
        ...line,
        quantityReceived: Math.floor(Number(line.quantityReceived) || 0),
      }))
      .filter((line) => line.quantityReceived > 0);
    if (lines.length === 0) {
      throw new BadRequestException('Provide at least one positive quantity to receive');
    }

    const requestedByItem = new Map<string, number>();
    for (const line of lines) {
      const previous = requestedByItem.get(line.itemId) ?? 0;
      requestedByItem.set(line.itemId, previous + line.quantityReceived);
    }
    for (const [itemId, requestedQty] of requestedByItem.entries()) {
      const item = po.items.find((i) => i.id === itemId);
      if (!item) throw new BadRequestException(`Unknown PO item ${itemId}`);
      const outstanding = item.quantity - item.received;
      if (requestedQty > outstanding) {
        throw new BadRequestException(
          `Received ${requestedQty} > outstanding ${outstanding} on item ${itemId}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const item = po.items.find((i) => i.id === line.itemId);
        if (!item) throw new BadRequestException(`Unknown PO item ${line.itemId}`);

        // Update the PO item
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { received: { increment: line.quantityReceived } },
        });

        // Create an inventory lot
        const lotNumber =
          line.lotNumber ||
          `${po.poNumber}-${item.variant.sku}-${Date.now().toString(36).slice(-4)}`;
        await tx.inventoryLot.create({
          data: {
            tenantId,
            variantId: item.variantId,
            lotNumber,
            quantity: line.quantityReceived,
            remaining: line.quantityReceived,
            unitCost: item.unitCost,
            expiryAt: line.expiryAt ? new Date(line.expiryAt) : null,
            poItemId: item.id,
          },
        });

        // Increment stock on hand
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockOnHand: { increment: line.quantityReceived } },
        });

        // Audit ledger
        await this.inventory.record(tx, {
          tenantId,
          variantId: item.variantId,
          change: line.quantityReceived,
          reason: StockChangeReason.PURCHASE_ORDER_RECEIVED,
          refType: 'PurchaseOrder',
          refId: po.id,
          note: dto.note,
          actorUserId,
        });
      }

      // Recompute allFullyReceived from freshly-read items (safer than tracking above)
      const remaining = await tx.purchaseOrderItem.findMany({
        where: { poId: po.id },
        select: { quantity: true, received: true },
      });
      const fullyReceived = remaining.every((r) => r.received >= r.quantity);
      const anyReceived = remaining.some((r) => r.received > 0);

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: fullyReceived
            ? PurchaseOrderStatus.RECEIVED
            : anyReceived
              ? PurchaseOrderStatus.PARTIAL
              : po.status,
          receivedAt: fullyReceived ? new Date() : po.receivedAt,
        },
        include: { items: true, supplier: true },
      });
    });
  }

  async cancel(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    this.assertTransition(po.status, PurchaseOrderStatus.CANCELLED);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
    });
  }
}
