import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { UserRole } from '@prisma/client';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { AssignCategoriesDto } from './dto/assign-categories.dto.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a product (admin/vendor/staff)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products for a tenant' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  @ApiQuery({ name: 'status', required: false, example: 'ACTIVE' })
  findAll(@Query('tenant') tenantSlug: string, @Query('status') status?: string) {
    return this.productsService.findAll(tenantSlug, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID with details' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a product' })
  publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a product' })
  unpublish(@Param('id') id: string) {
    return this.productsService.unpublish(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/categories')
  @ApiOperation({ summary: 'Assign categories to a product' })
  assignCategories(
    @Param('id') id: string,
    @Body() dto: AssignCategoriesDto,
  ) {
    return this.productsService.assignCategories(id, dto.categoryIds);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
