import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories for a tenant' })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  findAll(@Query('tenant') tenantSlug: string) {
    return this.categoriesService.findAll(tenantSlug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID with products' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (admin/staff only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
