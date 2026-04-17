import { Controller, Get, Post, Body, Patch, Param, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order.dto.js';

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
  @ApiOperation({ summary: 'List my orders' })
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user.id, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin/staff)' })
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status, dto.note, req.user.id);
  }
}
