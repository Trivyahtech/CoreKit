import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { VerifyPaymentDto } from './dto/update-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private verifyRazorpaySignature(
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature: string,
  ): boolean {
    const secret = this.config.get<string>('payments.razorpayKeySecret');
    if (!secret) {
      throw new InternalServerErrorException('Razorpay secret not configured');
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  private verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = this.config.get<string>('payments.razorpayWebhookSecret');
    if (!secret) {
      throw new InternalServerErrorException('Razorpay webhook secret not configured');
    }
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

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

  async verify(
    paymentId: string,
    dto: VerifyPaymentDto,
    userId: string,
    tenantId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId, order: { userId } },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === 'CAPTURED') {
      throw new BadRequestException('Payment already captured');
    }

    if (payment.provider === 'RAZORPAY') {
      if (!payment.gatewayOrderId) {
        throw new BadRequestException('Payment missing gateway order id');
      }
      if (!dto.gatewaySignature) {
        throw new UnauthorizedException('Gateway signature required');
      }
      const valid = this.verifyRazorpaySignature(
        payment.gatewayOrderId,
        dto.gatewayPaymentId,
        dto.gatewaySignature,
      );
      if (!valid) throw new UnauthorizedException('Invalid payment signature');
    }

    return this.capturePayment(payment, dto.gatewayPaymentId, dto.gatewaySignature);
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined) {
    if (!signature || !this.verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    if (event?.event !== 'payment.captured') {
      return { received: true };
    }

    const entity = event?.payload?.payment?.entity;
    const gatewayOrderId: string | undefined = entity?.order_id;
    const gatewayPaymentId: string | undefined = entity?.id;
    if (!gatewayOrderId || !gatewayPaymentId) {
      throw new BadRequestException('Malformed webhook payload');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'CAPTURED') return { received: true };

    await this.capturePayment(payment, gatewayPaymentId, undefined);
    return { received: true };
  }

  private async capturePayment(
    payment: { id: string; orderId: string; order: { status: any } },
    gatewayPaymentId: string,
    gatewaySignature: string | undefined,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId,
          gatewaySignature: gatewaySignature ?? null,
          status: 'CAPTURED',
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'CAPTURED', status: 'CONFIRMED' },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: payment.orderId,
          fromStatus: payment.order.status,
          toStatus: 'CONFIRMED',
          note: `Payment captured: ${gatewayPaymentId}`,
        },
      });

      return updatedPayment;
    });
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
