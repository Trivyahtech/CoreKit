import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus, UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';

class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
}

class CreatePoItemDto {
  @IsString() variantId: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitCost: number;
}

class CreatePoDto {
  @IsString() supplierId: string;
  @IsOptional() @IsDateString() expectedAt?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items: CreatePoItemDto[];
}

class ReceiveItemDto {
  @IsString() itemId: string;
  @IsInt() @Min(0) quantityReceived: number;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsDateString() expiryAt?: string;
}

class ReceivePoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
  @IsOptional() @IsString() note?: string;
}

class UpdateStatusDto {
  @IsEnum(PurchaseOrderStatus) status: PurchaseOrderStatus;
}

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  // Suppliers
  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers' })
  listSuppliers(@Request() req: any) {
    return this.service.listSuppliers(req.user.tenantId);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier' })
  createSupplier(@Request() req: any, @Body() dto: CreateSupplierDto) {
    return this.service.createSupplier(req.user.tenantId, dto);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update a supplier' })
  updateSupplier(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: Partial<CreateSupplierDto & { isActive: boolean }>,
  ) {
    return this.service.updateSupplier(id, req.user.tenantId, dto);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @Roles(UserRole.ADMIN)
  removeSupplier(@Param('id') id: string, @Request() req: any) {
    return this.service.removeSupplier(id, req.user.tenantId);
  }

  // Purchase orders
  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  list(@Request() req: any, @Query('status') status?: PurchaseOrderStatus) {
    return this.service.list(req.user.tenantId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase order (DRAFT)' })
  create(@Request() req: any, @Body() dto: CreatePoDto) {
    return this.service.create(req.user.tenantId, req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order' })
  find(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change the PO status' })
  setStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.setStatus(id, req.user.tenantId, dto.status, req.user.id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive items into stock (creates lots + ledger)' })
  receive(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ReceivePoDto,
  ) {
    return this.service.receive(id, req.user.tenantId, req.user.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @Roles(UserRole.ADMIN)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.service.cancel(id, req.user.tenantId);
  }
}
