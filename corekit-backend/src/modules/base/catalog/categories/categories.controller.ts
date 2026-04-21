import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { UserRole } from '@prisma/client';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a category (admin/staff only)' })
  create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.tenantId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories for a tenant' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  findAll(@Query('tenant') tenantSlug: string) {
    if (!tenantSlug) throw new BadRequestException('tenant query parameter required');
    return this.categoriesService.findAll(tenantSlug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID with published products' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  findOne(@Param('id') id: string, @Query('tenant') tenantSlug: string) {
    if (!tenantSlug) throw new BadRequestException('tenant query parameter required');
    return this.categoriesService.findOnePublic(id, tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (admin/staff only)' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, req.user.tenantId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.categoriesService.remove(id, req.user.tenantId);
  }
}
