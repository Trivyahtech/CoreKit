import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { UserRole } from '@prisma/client';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { AssignCategoriesDto } from './dto/assign-categories.dto.js';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a product (admin/vendor/staff)' })
  create(@Request() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.tenantId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published products for a tenant' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  findAll(@Query('tenant') tenantSlug: string) {
    if (!tenantSlug) throw new BadRequestException('tenant query parameter required');
    return this.productsService.findAllPublic(tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Get('admin/list')
  @ApiOperation({ summary: 'List all products (any status) for the caller’s tenant' })
  @ApiQuery({ name: 'status', required: false, example: 'DRAFT' })
  findAllAdmin(@Request() req: any, @Query('status') status?: string) {
    return this.productsService.findAllAdmin(req.user.tenantId, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a published product by ID' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  findOne(@Param('id') id: string, @Query('tenant') tenantSlug: string) {
    if (!tenantSlug) throw new BadRequestException('tenant query parameter required');
    return this.productsService.findOnePublic(id, tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Get any product by ID within the caller’s tenant' })
  findOneAdmin(@Param('id') id: string, @Request() req: any) {
    return this.productsService.findOneAdmin(id, req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, req.user.tenantId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a product' })
  publish(@Param('id') id: string, @Request() req: any) {
    return this.productsService.publish(id, req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a product' })
  unpublish(@Param('id') id: string, @Request() req: any) {
    return this.productsService.unpublish(id, req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/categories')
  @ApiOperation({ summary: 'Assign categories to a product' })
  assignCategories(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AssignCategoriesDto,
  ) {
    return this.productsService.assignCategories(id, req.user.tenantId, dto.categoryIds);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(id, req.user.tenantId);
  }

  // --- Variants ---

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a new variant to a product' })
  createVariant(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.createVariant(id, req.user.tenantId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch('variants/:variantId')
  @ApiOperation({ summary: 'Update a variant' })
  updateVariant(
    @Param('variantId') variantId: string,
    @Request() req: any,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, req.user.tenantId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('variants/:variantId')
  @ApiOperation({ summary: 'Delete a variant (admin only, no order history)' })
  removeVariant(@Param('variantId') variantId: string, @Request() req: any) {
    return this.productsService.removeVariant(variantId, req.user.tenantId);
  }

  // --- Images ---

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/images')
  @ApiOperation({ summary: 'Upload an image for a product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file: any,
    @Body('altText') altText?: string,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.productsService.uploadImage(id, req.user.tenantId, file, altText);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Set an image as the primary for a product' })
  setPrimaryImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Request() req: any,
  ) {
    return this.productsService.setPrimaryImage(id, imageId, req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Remove a product image' })
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Request() req: any,
  ) {
    return this.productsService.removeImage(id, imageId, req.user.tenantId);
  }
}
