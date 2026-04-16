import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all users for a tenant (Admin/Staff only)' })
  @ApiQuery({ name: 'tenant', required: true, type: String })
  findAll(@Query('tenant') tenantSlug: string) {
    return this.usersService.findAll(tenantSlug);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.usersService.updateRole(id, role);
  }
}
