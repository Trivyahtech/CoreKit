import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto, RefundOrderDto, CancelOrderDto } from './dto/update-order.dto.js';
import { renderInvoiceHtml } from './invoice.js';

const isAdminish = (role: string | undefined) =>
  role === UserRole.ADMIN || role === UserRole.STAFF;

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from active cart' })
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.id, req.user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders — own unless scope=tenant and caller is admin/staff' })
  @ApiQuery({ name: 'scope', required: false, enum: ['me', 'tenant'] })
  findAll(@Request() req: any, @Query('scope') scope?: string) {
    const allTenantOrders = scope === 'tenant' && isAdminish(req.user.role);
    return this.ordersService.findAll(req.user.id, req.user.tenantId, { allTenantOrders });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details (admin/staff can read any tenant order)' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const allTenantOrders = isAdminish(req.user.role);
    return this.ordersService.findOne(id, req.user.id, req.user.tenantId, { allTenantOrders });
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Printable HTML invoice (owner or admin/staff)' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async invoice(@Param('id') id: string, @Request() req: any, @Res() res: any) {
    const allTenantOrders = isAdminish(req.user.role);
    const { order, tenant } = await this.ordersService.getInvoiceData(
      id,
      req.user.id,
      req.user.tenantId,
      allTenantOrders,
    );
    res.send(
      renderInvoiceHtml(
        {
          ...order,
          createdAt: order.createdAt.toISOString(),
          subtotal: order.subtotal.toString(),
          taxAmount: order.taxAmount.toString(),
          shippingAmount: order.shippingAmount.toString(),
          discountAmount: order.discountAmount.toString(),
          grandTotal: order.grandTotal.toString(),
          items: order.items.map((it: any) => ({
            productName: it.productName,
            variantName: it.variantName,
            quantity: it.quantity,
            unitPrice: it.unitPrice.toString(),
            totalAmount: it.totalAmount.toString(),
          })),
          shippingAddress: order.shippingAddress as any,
          billingAddress: order.billingAddress as any,
          payments: order.payments?.map((p: any) => ({
            method: p.method,
            status: p.status,
          })),
        } as any,
        {
          name: tenant.name,
          slug: tenant.slug,
          settings: tenant.settings as any,
        },
      ),
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Customer cancels own order (CREATED or CONFIRMED only)' })
  cancel(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelByCustomer(id, req.user.id, req.user.tenantId, dto?.reason);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin/staff)' })
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, req.user.tenantId, dto.status, dto.note, req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund an order (admin only)' })
  refund(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RefundOrderDto,
  ) {
    return this.ordersService.refund(id, req.user.tenantId, dto?.note, req.user.id);
  }
}
