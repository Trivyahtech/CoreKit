import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dto/create-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart.dto.js';
import { ApplyCouponDto } from './dto/apply-coupon.dto.js';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart with items' })
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.id, req.user.tenantId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@Request() req: any, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, req.user.tenantId, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Request() req: any,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(req.user.id, req.user.tenantId, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(@Request() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, req.user.tenantId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user.id, req.user.tenantId);
  }

  @Post('coupon')
  @ApiOperation({ summary: 'Apply a coupon code to cart' })
  applyCoupon(@Request() req: any, @Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(req.user.id, req.user.tenantId, dto.couponCode);
  }
}
