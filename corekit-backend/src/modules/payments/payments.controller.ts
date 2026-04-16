import { Controller, Get, Post, Body, Param, Patch, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { VerifyPaymentDto } from './dto/update-payment.dto.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Initiate a payment for an order' })
  initiate(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.initiate(req.user.id, req.user.tenantId, dto);
  }

  @Public()
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify and capture payment (webhook/callback)' })
  verify(@Param('id') id: string, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verify(id, dto);
  }

  @ApiBearerAuth()
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments for an order' })
  findByOrder(@Param('orderId') orderId: string, @Request() req: any) {
    return this.paymentsService.findByOrder(orderId, req.user.id);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
