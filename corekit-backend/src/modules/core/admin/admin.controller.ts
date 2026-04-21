import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AdminDataService } from './data.service.js';

@ApiTags('Admin Data')
@ApiBearerAuth()
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminDataController {
  constructor(private readonly data: AdminDataService) {}

  @Get('export/:scope')
  @ApiOperation({ summary: 'Export a dataset as CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(
    @Param('scope') scope: string,
    @Request() req: any,
    @Res() res: any,
  ) {
    const valid = new Set([
      'products',
      'categories',
      'customers',
      'orders',
      'coupons',
      'inventory-ledger',
    ]);
    if (!valid.has(scope)) throw new BadRequestException('Unknown scope');
    const csv = await this.data.export(req.user.tenantId, scope as any);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${scope}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Post('import/:scope')
  @ApiOperation({ summary: 'Import a dataset from CSV (products, categories, coupons)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async import(
    @Param('scope') scope: string,
    @Request() req: any,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('CSV file required');
    const text = file.buffer.toString('utf8');
    const tenantId = req.user.tenantId;
    if (scope === 'categories') return this.data.importCategories(tenantId, text);
    if (scope === 'coupons') return this.data.importCoupons(tenantId, text);
    if (scope === 'products') return this.data.importProducts(tenantId, text);
    throw new BadRequestException(
      'Importable scopes: products, categories, coupons',
    );
  }

  @Post('purge/:scope/preview')
  @ApiOperation({ summary: 'Count rows that would be purged (dry-run, returns confirm token)' })
  purgePreview(@Param('scope') scope: string, @Request() req: any) {
    return this.data.purgePreview(req.user.tenantId, scope as any);
  }

  @Post('purge/:scope')
  @ApiOperation({ summary: 'Execute a purge with a preview confirm token' })
  purge(
    @Param('scope') scope: string,
    @Request() req: any,
    @Body('confirmToken') confirmToken: string,
  ) {
    if (!confirmToken) throw new BadRequestException('confirmToken required');
    return this.data.purge(req.user.tenantId, scope as any, confirmToken, req.user.id);
  }
}
