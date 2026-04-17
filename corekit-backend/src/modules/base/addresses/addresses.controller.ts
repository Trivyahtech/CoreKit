import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  create(@Request() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, req.user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my addresses' })
  findAll(@Request() req: any) {
    return this.addressesService.findAll(req.user.id, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.addressesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(id, req.user.id, req.user.tenantId, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  setDefault(@Param('id') id: string, @Request() req: any) {
    return this.addressesService.setDefault(id, req.user.id, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.addressesService.remove(id, req.user.id);
  }
}
