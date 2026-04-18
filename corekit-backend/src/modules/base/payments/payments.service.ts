import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { VerifyPaymentDto } from './dto/update-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(userId: string, tenantId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId, tenantId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === 'CAPTURED') {
      throw new BadRequestException('Order already paid');
    }

    if (dto.provider === 'COD') {
      // COD: mark payment as authorized immediately
      const payment = await this.prisma.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: 'COD',
          method: 'COD',
          status: 'AUTHORIZED',
          amount: order.grandTotal,
          currencyCode: order.currencyCode,
          processedAt: new Date(),
        },
      });

      // Update order payment status
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'AUTHORIZED', status: 'CONFIRMED' },
      });

      // Log status transition
      await this.prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'CONFIRMED',
          note: 'COD payment authorized',
        },
      });

      return payment;
    }

    // Online payment (Razorpay placeholder)
    // In production, you'd call Razorpay's Orders API here
    const gatewayOrderId = `gw_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        orderId: order.id,
        provider: dto.provider as any,
        method: dto.method as any,
        status: 'PENDING',
        amount: order.grandTotal,
        currencyCode: order.currencyCode,
        gatewayOrderId,
      },
    });

    return {
      payment,
      gatewayOrderId,
      amount: order.grandTotal,
      currency: order.currencyCode,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    };
  }

  async verify(paymentId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === 'CAPTURED') {
      throw new BadRequestException('Payment already captured');
    }

    // In production, verify signature with Razorpay:
    // const isValid = razorpay.validatePaymentVerification(...)
    // For now, we trust the gateway payment ID

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        gatewayPaymentId: dto.gatewayPaymentId,
        gatewaySignature: dto.gatewaySignature,
        status: 'CAPTURED',
        processedAt: new Date(),
      },
    });

    // Update order
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'CAPTURED', status: 'CONFIRMED' },
    });

    await this.prisma.orderStatusLog.create({
      data: {
        orderId: payment.orderId,
        fromStatus: payment.order.status,
        toStatus: 'CONFIRMED',
        note: `Payment captured: ${dto.gatewayPaymentId}`,
      },
    });

    return updatedPayment;
  }

  async findByOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true, grandTotal: true },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
