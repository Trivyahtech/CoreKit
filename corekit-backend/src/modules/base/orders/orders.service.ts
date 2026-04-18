import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Decimal } from '@prisma/client-runtime-utils';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { OrderConfirmationJob, OrderStatusJob } from '../../../platform/mail/email.processor.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async createFromCart(userId: string, tenantId: string, dto: CreateOrderDto) {
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

    // 2. Validate and snapshot addresses
    const [billingAddr, shippingAddr] = await Promise.all([
      this.prisma.address.findFirst({ where: { id: dto.billingAddressId, userId } }),
      this.prisma.address.findFirst({ where: { id: dto.shippingAddressId, userId } }),
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

    // 5. Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { increment: item.quantity } },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          tenantId,
          userId,
          orderNumber: this.generateOrderNumber(),
          status: 'CREATED',
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'PENDING',
          subtotal: cart.subtotal,
          taxAmount: cart.taxAmount,
          shippingAmount: cart.shippingAmount,
          discountAmount: cart.discountAmount,
          grandTotal: cart.grandTotal,
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
              taxAmount: item.totalPrice.mul(new Decimal(0.18)),
              totalAmount: item.totalPrice.mul(new Decimal(1.18)),
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

  async findAll(userId: string, tenantId: string) {
    return this.prisma.order.findMany({
      where: { userId, tenantId },
      include: {
        items: { select: { id: true, productName: true, quantity: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        payments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
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

  async updateStatus(
    orderId: string,
    newStatus: string,
    note?: string,
    updatedByUserId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
          }
        }
      }

      if (newStatus === 'COMPLETED') {
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
