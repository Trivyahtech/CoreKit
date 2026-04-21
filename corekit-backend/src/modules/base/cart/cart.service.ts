import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client-runtime-utils';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { TenantsService } from '../../core/tenants/tenants.service.js';
import { AddCartItemDto } from './dto/create-cart.dto.js';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  /** Get or create the user's active cart */
  private async getOrCreateCart(userId: string, tenantId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, title: true, price: true, stockOnHand: true, status: true, weightGrams: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, tenantId, status: 'ACTIVE' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
              variant: { select: { id: true, sku: true, title: true, price: true, stockOnHand: true, status: true, weightGrams: true } },
            },
          },
        },
      });
    }

    return cart;
  }

  /** Recalculate cart totals from items */
  private async recalculateTotals(cartId: string, tenantId: string) {
    const [items, config] = await Promise.all([
      this.prisma.cartItem.findMany({ where: { cartId } }),
      this.tenants.getConfig(tenantId),
    ]);

    const subtotal = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Decimal(0),
    );

    const taxAmount = subtotal.mul(config.taxRate);
    const grandTotal = subtotal.add(taxAmount);

    return this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        taxAmount,
        shippingAmount: new Decimal(0),
        discountAmount: new Decimal(0),
        grandTotal,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, title: true, price: true, stockOnHand: true, weightGrams: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getCart(userId: string, tenantId: string) {
    return this.getOrCreateCart(userId, tenantId);
  }

  async addItem(userId: string, tenantId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId, tenantId);

    // Validate variant exists and has stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: { select: { id: true, name: true, status: true, isPublished: true } } },
    });

    if (!variant || variant.status !== 'ACTIVE') {
      throw new BadRequestException('Variant not available');
    }

    if (!variant.product.isPublished) {
      throw new BadRequestException('Product is not published');
    }

    if (variant.productId !== dto.productId) {
      throw new BadRequestException('Variant does not belong to this product');
    }

    const availableStock = variant.stockOnHand - variant.reservedStock;
    if (dto.quantity > availableStock) {
      throw new BadRequestException(`Only ${availableStock} items available`);
    }

    // Check if item already in cart — update qty instead
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > availableStock) {
        throw new BadRequestException(`Only ${availableStock} items available (${existingItem.quantity} already in cart)`);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          totalPrice: variant.price.mul(new Decimal(newQty)),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          tenantId,
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          titleSnapshot: variant.product.name + (variant.title ? ` - ${variant.title}` : ''),
          skuSnapshot: variant.sku,
          unitPrice: variant.price,
          quantity: dto.quantity,
          totalPrice: variant.price.mul(new Decimal(dto.quantity)),
        },
      });
    }

    return this.recalculateTotals(cart.id, tenantId);
  }

  async updateItemQuantity(userId: string, tenantId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true, tenantId: true } },
        variant: { select: { price: true, stockOnHand: true, reservedStock: true } },
      },
    });

    if (!item || item.cart.userId !== userId || item.cart.tenantId !== tenantId) {
      throw new NotFoundException('Cart item not found');
    }

    const available = item.variant.stockOnHand - item.variant.reservedStock;
    if (quantity > available) {
      throw new BadRequestException(`Only ${available} items available`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        totalPrice: item.variant.price.mul(new Decimal(quantity)),
      },
    });

    return this.recalculateTotals(item.cartId, tenantId);
  }

  async removeItem(userId: string, tenantId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { id: true, userId: true, tenantId: true } } },
    });

    if (!item || item.cart.userId !== userId || item.cart.tenantId !== tenantId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.recalculateTotals(item.cart.id, tenantId);
  }

  async clearCart(userId: string, tenantId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
    });

    if (!cart) throw new NotFoundException('No active cart');

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.recalculateTotals(cart.id, tenantId);
  }

  async applyCoupon(userId: string, tenantId: string, couponCode: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: couponCode.toUpperCase() } },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Coupon not yet active');
    }
    if (coupon.endsAt && now > coupon.endsAt) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    const config = await this.tenants.getConfig(tenantId);

    if (coupon.minCartValue && cart.subtotal.lessThan(coupon.minCartValue)) {
      throw new BadRequestException(
        `Minimum cart value of ${config.currencyCode} ${coupon.minCartValue} required`,
      );
    }

    let discount: Decimal;
    if (coupon.type === 'PERCENTAGE') {
      discount = cart.subtotal.mul(coupon.value).div(new Decimal(100));
      if (coupon.maxDiscountAmount && discount.greaterThan(coupon.maxDiscountAmount)) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.value;
    }

    const grandTotal = cart.subtotal.add(cart.taxAmount).add(cart.shippingAmount).sub(discount);

    return this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountAmount: discount,
        grandTotal: grandTotal.lessThan(new Decimal(0)) ? new Decimal(0) : grandTotal,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, title: true, price: true } },
          },
        },
      },
    });
  }
}
