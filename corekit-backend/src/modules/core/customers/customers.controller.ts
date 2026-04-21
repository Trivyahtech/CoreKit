import {
  Controller,
  Get,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { CustomersService } from './customers.service.js';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers with purchase aggregates' })
  @ApiQuery({ name: 'q', required: false })
  list(@Request() req: any, @Query('q') q?: string) {
    return this.customers.list(req.user.tenantId, { search: q });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer with order history' })
  find(@Param('id') id: string, @Request() req: any) {
    return this.customers.findOne(id, req.user.tenantId);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Audit: every product given to this customer (line items)' })
  @ApiQuery({ name: 'limit', required: false })
  audit(
    @Param('id') id: string,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.customers.audit(
      id,
      req.user.tenantId,
      limit ? Number(limit) : 50,
    );
  }
}
