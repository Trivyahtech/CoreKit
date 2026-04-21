import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { Decimal } from '@prisma/client-runtime-utils';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { TenantsService } from '../../core/tenants/tenants.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { OrderConfirmationJob, OrderStatusJob } from '../../../platform/mail/email.processor.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly shipping: ShippingService,
    private readonly inventory: InventoryService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
  ) {}

  private async nextOrderNumber(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    tenantId: string,
  ): Promise<string> {
    const newId = randomUUID();
    const rows = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "Counter" ("id", "tenantId", "key", "value", "updatedAt")
      VALUES (${newId}, ${tenantId}, 'order', 1, NOW())
      ON CONFLICT ("tenantId", "key")
      DO UPDATE SET "value" = "Counter"."value" + 1, "updatedAt" = NOW()
      RETURNING "value"
    `;
    const seq = rows[0]?.value ?? 1;
    const now = new Date();
    const yy = now.getUTCFullYear().toString().slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `ORD-${yy}${mm}-${seq.toString().padStart(6, '0')}`;
  }

  async createFromCart(userId: string, tenantId: string, dto: CreateOrderDto) {
    const config = await this.tenants.getConfig(tenantId);

    // 1. Get active cart with items
    const cart = await this.prisma.cart.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            variant: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Validate and snapshot addresses (tenant-scoped)
    const [billingAddr, shippingAddr] = await Promise.all([
      this.prisma.address.findFirst({ where: { id: dto.billingAddressId, userId, tenantId } }),
      this.prisma.address.findFirst({ where: { id: dto.shippingAddressId, userId, tenantId } }),
    ]);

    if (!billingAddr) throw new BadRequestException('Billing address not found');
    if (!shippingAddr) throw new BadRequestException('Shipping address not found');

    // 3. Get user email for notifications
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    // 4. Validate stock for all items
    for (const item of cart.items) {
      const available = item.variant.stockOnHand - item.variant.reservedStock;
      if (item.quantity > available) {
        throw new BadRequestException(
          `Insufficient stock for "${item.titleSnapshot}": requested ${item.quantity}, available ${available}`,
        );
      }
    }

    // 4a. Resolve shipping cost if a rule was chosen
    let shippingAmount = cart.shippingAmount;
    if (dto.shippingRuleId) {
      const quotes = await this.shipping.quote(tenantId, {
        pincode: shippingAddr.pincode,
        weightGrams: dto.weightGrams ?? 0,
        orderValue: cart.subtotal.toNumber(),
      });
      const chosen = quotes.find((q) => q.ruleId === dto.shippingRuleId);
      if (!chosen) {
        throw new BadRequestException('Chosen shipping method is not available for this order');
      }
      shippingAmount = new Decimal(chosen.cost);
    } else if (config.shippingEnabled) {
      // Fallback: if shipping is enabled but client didn't choose, require it
      throw new BadRequestException(
        'shippingRuleId required (call POST /shipping/quote first)',
      );
    }

    const taxAmount = cart.taxAmount;
    const grandTotal = cart.subtotal
      .add(taxAmount)
      .add(shippingAmount)
      .sub(cart.discountAmount);

    // 5. Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      if (dto.couponCode) {
        const rows = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usedCount" = "usedCount" + 1
          WHERE "tenantId" = ${tenantId}
            AND "code" = ${dto.couponCode.toUpperCase()}
            AND "isActive" = true
            AND ("startsAt" IS NULL OR "startsAt" <= NOW())
            AND ("endsAt" IS NULL OR "endsAt" >= NOW())
            AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
        `;
        if (rows === 0) {
          throw new BadRequestException('Coupon is no longer valid or usage limit reached');
        }
      }

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { increment: item.quantity } },
        });
      }

      const orderNumber = await this.nextOrderNumber(tx, tenantId);

      // Audit: reserve now, physically decrement at ship (below).
      // We still record ORDER_PLACED with change=0 so the ledger shows
      // which customer committed this stock.
      for (const item of cart.items) {
        if (!item.variantId) continue;
        await this.inventory.record(tx, {
          tenantId,
          variantId: item.variantId,
          change: 0,
          reason: 'ORDER_PLACED' as any,
          refType: 'Order',
          refId: undefined, // orderId not yet known; filled below
          note: `Reserved ${item.quantity} for ${userId}`,
          actorUserId: userId,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          tenantId,
          userId,
          orderNumber,
          status: 'CREATED',
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'PENDING',
          subtotal: cart.subtotal,
          taxAmount,
          shippingAmount,
          discountAmount: cart.discountAmount,
          grandTotal,
          currencyCode: config.currencyCode,
          couponCode: dto.couponCode,
          billingAddress: {
            fullName: billingAddr.fullName,
            phone: billingAddr.phone,
            line1: billingAddr.line1,
            line2: billingAddr.line2,
            city: billingAddr.city,
            state: billingAddr.state,
            country: billingAddr.country,
            pincode: billingAddr.pincode,
          },
          shippingAddress: {
            fullName: shippingAddr.fullName,
            phone: shippingAddr.phone,
            line1: shippingAddr.line1,
            line2: shippingAddr.line2,
            city: shippingAddr.city,
            state: shippingAddr.state,
            country: shippingAddr.country,
            pincode: shippingAddr.pincode,
          },
          customerNote: dto.customerNote,
          placedAt: new Date(),
          items: {
            create: cart.items.map((item) => ({
              tenantId,
              productId: item.productId,
              variantId: item.variantId,
              vendorId: null,
              productName: item.titleSnapshot,
              variantName: item.variant.title,
              sku: item.skuSnapshot,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.totalPrice,
              taxAmount: item.totalPrice.mul(config.taxRate),
              totalAmount: item.totalPrice.mul(new Decimal(1).add(config.taxRate)),
              status: 'CREATED',
            })),
          },
          statusLogs: {
            create: {
              fromStatus: null,
              toStatus: 'CREATED',
              note: 'Order placed',
            },
          },
        },
        include: {
          items: true,
          statusLogs: true,
        },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'CONVERTED' },
      });

      return newOrder;
    });

    // 6. Enqueue order confirmation email (outside transaction)
    if (user) {
      const shippingAddrSnapshot = order.shippingAddress as any;
      const emailJob: OrderConfirmationJob = {
        type: 'order-confirmation',
        to: user.email,
        data: {
          customerName: user.firstName,
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            total: item.totalAmount.toString(),
          })),
          subtotal: order.subtotal.toString(),
          tax: order.taxAmount.toString(),
          shipping: order.shippingAmount.toString(),
          discount: order.discountAmount.toString(),
          grandTotal: order.grandTotal.toString(),
          currency: order.currencyCode,
          shippingAddress: {
            fullName: shippingAddrSnapshot.fullName,
            line1: shippingAddrSnapshot.line1,
            city: shippingAddrSnapshot.city,
            state: shippingAddrSnapshot.state,
            pincode: shippingAddrSnapshot.pincode,
            phone: shippingAddrSnapshot.phone,
          },
        },
      };

      await this.emailQueue.add('order-confirmation', emailJob, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      this.logger.log(`📧 Queued order confirmation for ${user.email}`);
    }

    return order;
  }

  async findAll(userId: string, tenantId: string, opts: { allTenantOrders?: boolean } = {}) {
    return this.prisma.order.findMany({
      where: opts.allTenantOrders
        ? { tenantId }
        : { userId, tenantId },
      include: {
        items: { select: { id: true, productName: true, quantity: true, totalAmount: true } },
        user: opts.allTenantOrders
          ? { select: { id: true, firstName: true, lastName: true, email: true } }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, tenantId: string, opts: { allTenantOrders?: boolean } = {}) {
    const order = await this.prisma.order.findFirst({
      where: opts.allTenantOrders
        ? { id, tenantId }
        : { id, userId, tenantId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        payments: true,
        user: opts.allTenantOrders
          ? { select: { id: true, firstName: true, lastName: true, email: true } }
          : false,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getInvoiceData(
    id: string,
    userId: string,
    tenantId: string,
    allTenantOrders: boolean,
  ) {
    const order = await this.prisma.order.findFirst({
      where: allTenantOrders ? { id, tenantId } : { id, userId, tenantId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        payments: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { order, tenant };
  }

  async findByOrderNumber(orderNumber: string, tenantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { tenantId_orderNumber: { tenantId, orderNumber } },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        payments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async refund(orderId: string, tenantId: string, note: string | undefined, actorId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        user: { select: { email: true, firstName: true } },
        payments: true,
        items: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'REFUNDED') {
      throw new BadRequestException('Order already refunded');
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled orders cannot be refunded — use a new refund flow');
    }

    const captured = order.payments.find((p) => p.status === 'CAPTURED');

    const result = await this.prisma.$transaction(async (tx) => {
      // Release reserved stock and reverse completed stock if needed
      for (const item of order.items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;

        if (order.status === 'COMPLETED') {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockOnHand: { increment: item.quantity } },
          });
          await this.inventory.record(tx, {
            tenantId,
            variantId: item.variantId,
            change: item.quantity,
            reason: 'ORDER_REFUNDED' as any,
            refType: 'Order',
            refId: orderId,
            note: note ?? 'Refund — stock returned',
            actorUserId: actorId,
          });
        } else {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { decrement: item.quantity } },
          });
          await this.inventory.record(tx, {
            tenantId,
            variantId: item.variantId,
            change: 0,
            reason: 'ORDER_REFUNDED' as any,
            refType: 'Order',
            refId: orderId,
            note: note ?? 'Refund — reservation released',
            actorUserId: actorId,
          });
        }
      }

      if (captured) {
        await tx.payment.update({
          where: { id: captured.id },
          data: { status: 'REFUNDED' },
        });
      }

      await tx.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'REFUNDED',
          note: note ?? 'Refund issued',
          createdByUserId: actorId,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
        include: { statusLogs: { orderBy: { createdAt: 'asc' } }, payments: true },
      });
    });

    // TODO: call Razorpay refund API for captured.gatewayPaymentId when RAZORPAY_KEY_SECRET present

    if (order.user) {
      const statusJob: OrderStatusJob = {
        type: 'order-status-update',
        to: order.user.email,
        customerName: order.user.firstName,
        orderNumber: order.orderNumber,
        newStatus: 'REFUNDED',
        note,
      };
      await this.emailQueue.add('order-status-update', statusJob, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }

    return result;
  }

  async cancelByCustomer(
    orderId: string,
    userId: string,
    tenantId: string,
    reason?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, tenantId },
      include: { items: true, payments: true, user: { select: { email: true, firstName: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!['CREATED', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException(
        'Order can no longer be cancelled — please contact support.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { decrement: item.quantity } },
        });
        await this.inventory.record(tx, {
          tenantId,
          variantId: item.variantId,
          change: 0,
          reason: 'ORDER_CANCELLED' as any,
          refType: 'Order',
          refId: orderId,
          note: reason ?? 'Customer cancelled',
          actorUserId: userId,
        });
      }

      await tx.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'CANCELLED',
          note: reason
            ? `Customer cancelled: ${reason}`
            : 'Customer cancelled the order',
          createdByUserId: userId,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus:
            order.paymentStatus === 'CAPTURED' ? 'REFUNDED' : order.paymentStatus,
        },
        include: { items: true, statusLogs: { orderBy: { createdAt: 'asc' } }, payments: true },
      });
    });

    if (order.user) {
      const statusJob: OrderStatusJob = {
        type: 'order-status-update',
        to: order.user.email,
        customerName: order.user.firstName,
        orderNumber: order.orderNumber,
        newStatus: 'CANCELLED',
        note: reason,
      };
      await this.emailQueue.add('order-status-update', statusJob, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }

    return result;
  }

  async updateStatus(
    orderId: string,
    tenantId: string,
    newStatus: string,
    note?: string,
    updatedByUserId?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { user: { select: { email: true, firstName: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus as any,
          note,
          createdByUserId: updatedByUserId,
        },
      });

      if (newStatus === 'CANCELLED') {
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { reservedStock: { decrement: item.quantity } },
            });
            await this.inventory.record(tx, {
              tenantId,
              variantId: item.variantId,
              change: 0,
              reason: 'ORDER_CANCELLED' as any,
              refType: 'Order',
              refId: orderId,
              note: note ?? 'Cancelled by admin',
              actorUserId: updatedByUserId,
            });
          }
        }
      }

      if (newStatus === 'COMPLETED' || newStatus === 'SHIPPED') {
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockOnHand: { decrement: item.quantity },
                reservedStock: { decrement: item.quantity },
              },
            });
            // Consume lots (FIFO)
            await this.inventory.consumeLots(tx, {
              tenantId,
              variantId: item.variantId,
              quantity: item.quantity,
            });
            await this.inventory.record(tx, {
              tenantId,
              variantId: item.variantId,
              change: -item.quantity,
              reason: 'ORDER_PLACED' as any,
              refType: 'Order',
              refId: orderId,
              note: note ?? `Fulfilled order (${newStatus})`,
              actorUserId: updatedByUserId,
            });
          }
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: newStatus as any },
        include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
    });

    // Enqueue status update email
    if (order.user) {
      const statusJob: OrderStatusJob = {
        type: 'order-status-update',
        to: order.user.email,
        customerName: order.user.firstName,
        orderNumber: order.orderNumber,
        newStatus,
        note,
      };

      await this.emailQueue.add('order-status-update', statusJob, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      this.logger.log(`📧 Queued status update email for ${order.user.email}: ${newStatus}`);
    }

    return updatedOrder;
  }
}
