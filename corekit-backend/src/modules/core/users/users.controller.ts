import { Controller, Get, Patch, Post, Param, Body, Request, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { UsersService } from './users.service.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

class ChangePasswordDto {
  @IsString()
  @Length(1, 256)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(256)
  newPassword: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  getMe(@Request() req: any) {
    return this.usersService.findMe(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile (firstName/lastName/phone)' })
  updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Post('me/password')
  @ApiOperation({ summary: 'Change my password' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changeMyPassword(
      req.user.id,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all users for the caller’s tenant (Admin/Staff only)' })
  findAll(@Request() req: any) {
    return this.usersService.findAllByTenantId(req.user.tenantId);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role within caller’s tenant (Admin only)' })
  updateRole(
    @Param('id') id: string,
    @Request() req: any,
    @Body('role') role: UserRole,
  ) {
    if (id === req.user.id && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admins cannot demote themselves');
    }
    return this.usersService.updateRole(id, req.user.tenantId, role);
  }
}
